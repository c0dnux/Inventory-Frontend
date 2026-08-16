import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("renders page info and page buttons", () => {
    render(<Pagination page={2} pageSize={15} totalCount={45} onPageChange={() => {}} />);
    expect(screen.getByText("Showing 16–30 of 45")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
  });

  it("calls onPageChange when clicking a page", async () => {
    const onChange = vi.fn();
    render(<Pagination page={1} pageSize={15} totalCount={60} onPageChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "2" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("collapses the page range with an ellipsis for large page counts", () => {
    render(<Pagination page={10} pageSize={15} totalCount={300} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "9" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "11" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "19" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "3" })).not.toBeInTheDocument();
  });

  it("disables prev on first page and next on last page", () => {
    render(<Pagination page={1} pageSize={15} totalCount={15} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
