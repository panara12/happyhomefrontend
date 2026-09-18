import { useApiQuery } from "./useApiQuery";


export function useGetAllAccountingConst() {
    return useApiQuery({
        path: "/accounting/getallaccountstates",
        queryKey: ["accountingConst"],
        params: { limit: 100 },
    });
}

export function useGetDashboardData({ enabled = true } = {}) {
    return useApiQuery({
        path: "/accounting/getdashboarddata",
        queryKey: ["dashboardData"],
        params: { limit: 100 },
        enabled,
        retry: false,
    });
}