import { useApiQuery } from "./useApiQuery";


export function useGetAllAccountingConst() {
    return useApiQuery({
        path: "/accounting/getallaccountstates",
        queryKey: ["accountingConst"],
        params: { limit: 100 },
    });
}

export function useGetDashboardData() {
    return useApiQuery({
        path: "/accounting/getdashboarddata",
        queryKey: ["dashboardData"],
        params: { limit: 100 },
    });
}