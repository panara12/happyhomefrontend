import { useApiQuery } from "./useApiQuery";


export function useGetAllAccountingConst() {
    return useApiQuery({
        path: "/accounting/getallaccountstates",
        queryKey: ["accountingConst"],
        params: { limit: 100 },
    });
}

export function useGetDashboardData({ enabled = true, period, month, startDate, endDate } = {}) {
    const params = { limit: 100 };
    if (period) params.period = period;
    if (month) params.month = month;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return useApiQuery({
        path: "/accounting/getdashboarddata",
        queryKey: ["dashboardData", period || "all", month || "all", startDate || "all", endDate || "all"],
        params,
        enabled,
        retry: false,
    });
}

export function useGetAdminMonthlyExpense({ enabled = true } = {}) {
    return useApiQuery({
        path: "/accounting/adminmonthlyexpense",
        queryKey: ["adminMonthlyExpense"],
        enabled,
        retry: false,
    });
}