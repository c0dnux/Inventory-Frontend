import { api } from "../lib/api";
import type { AuditLog, PageParams } from "../types";

interface AuditListResponse {
  data: { audits: AuditLog[] };
  totalCount?: number;
}

export const auditsApi = {
  list: async (params?: PageParams) => {
    const res = await api.get<AuditListResponse>("/audits", { params });
    return {
      audits: res.data.data.audits,
      totalCount: res.data.totalCount ?? res.data.data.audits.length,
    };
  },
};
