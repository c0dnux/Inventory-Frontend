import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  optimisticPatch,
  optimisticUpsert,
  optimisticRemove,
  snapshotQueries,
  restoreQueries,
} from "./queryCache";

interface Item {
  _id: string;
  name: string;
  stock?: number;
}

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function seed(client: QueryClient) {
  client.setQueryData(["products", { page: 1 }], {
    products: [
      { _id: "a", name: "Alpha", stock: 5 },
      { _id: "b", name: "Beta", stock: 0 },
    ],
    totalCount: 2,
  });
  client.setQueryData(["products", "select"], {
    products: [{ _id: "a", name: "Alpha", stock: 5 }],
  });
  client.setQueryData(["products", "dashboard"], { totalValue: 123 });
}

describe("queryCache helpers", () => {
  let client: QueryClient;

  beforeEach(() => {
    client = makeClient();
    seed(client);
  });

  it("patches matching items across every list variant", () => {
    optimisticPatch<Item>(client, "products", (p) => (p._id === "a" ? { ...p, stock: 42 } : p));
    const page1 = client.getQueryData<{ products: Item[] }>(["products", { page: 1 }]);
    const select = client.getQueryData<{ products: Item[] }>(["products", "select"]);
    expect(page1?.products.find((p) => p._id === "a")?.stock).toBe(42);
    expect(select?.products.find((p) => p._id === "a")?.stock).toBe(42);
    expect(page1?.products.find((p) => p._id === "b")?.stock).toBe(0);
  });

  it("leaves non-list shapes (dashboard stats) untouched", () => {
    optimisticPatch<Item>(client, "products", (p) => ({ ...p, stock: 1 }));
    const dashboard = client.getQueryData(["products", "dashboard"]);
    expect(dashboard).toEqual({ totalValue: 123 });
  });

  it("upserts new items at the front and replaces existing ones by id", () => {
    optimisticUpsert<Item>(client, "products", { _id: "c", name: "Gamma", stock: 3 });
    const page1 = client.getQueryData<{ products: Item[]; totalCount: number }>([
      "products",
      { page: 1 },
    ]);
    expect(page1?.products[0]._id).toBe("c");
    expect(page1?.totalCount).toBe(2);

    optimisticUpsert<Item>(client, "products", { _id: "a", name: "Alpha X", stock: 9 });
    const after = client.getQueryData<{ products: Item[] }>(["products", { page: 1 }]);
    expect(after?.products).toHaveLength(3);
    expect(after?.products.find((p) => p._id === "a")?.name).toBe("Alpha X");
  });

  it("removes items and decrements totalCount without going below zero", () => {
    optimisticRemove<Item>(client, "products", "b");
    const page1 = client.getQueryData<{ products: Item[]; totalCount: number }>([
      "products",
      { page: 1 },
    ]);
    expect(page1?.products).toHaveLength(1);
    expect(page1?.totalCount).toBe(1);

    optimisticRemove<Item>(client, "products", "missing");
    const after = client.getQueryData<{ products: Item[]; totalCount: number }>([
      "products",
      { page: 1 },
    ]);
    expect(after?.products).toHaveLength(1);
    expect(after?.totalCount).toBe(1);
  });

  it("snapshot/restore rolls a patch back exactly", () => {
    const snapshot = snapshotQueries(client, "products");
    optimisticPatch<Item>(client, "products", (p) => ({ ...p, stock: -1 }));
    restoreQueries(client, snapshot);
    const page1 = client.getQueryData<{ products: Item[] }>(["products", { page: 1 }]);
    expect(page1?.products.find((p) => p._id === "a")?.stock).toBe(5);
    expect(page1?.products.find((p) => p._id === "b")?.stock).toBe(0);
  });
});
