import { useApiQuery } from "./useApiQuery";


export function useGetAllAccountingConst() {
    return useApiQuery({
        path: "/accounting/getallaccountstates",
        queryKey: ["accountingConst"],
        params: { limit: 100 },
    });
}