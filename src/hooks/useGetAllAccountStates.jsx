import { useApiQuery } from "./useApiQuery";


export function useGetAllAccountingConst() {
    return useApiQuery({
        path: "/accounting/getallaccountstates",
        queryKey: ["accountingConst"],
        params: { limit: 100 },
    });
}

export function useGetDashboardData({ enabled = true, period, month } = {}) {
    const params = { limit: 100 };
    if (period) params.period = period;
    if (month) params.month = month;

    return useApiQuery({
        path: "/accounting/getdashboarddata",
        queryKey: ["dashboardData", period || "all", month || "all"],
        params,
        enabled,
        retry: false,
    });
}