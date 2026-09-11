import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const EXPENSE_QUERY_KEY = ["expense"];

export function useAddExpense() {
    return useApiMutation({
        url: "/expense/addexpense",
        method: "post",
        invalidateKeys: [EXPENSE_QUERY_KEY],
    });
}

export function useGetAllExpense({ enabled = true } = {}) {
    return useApiQuery({
        queryKey: EXPENSE_QUERY_KEY,
        path: "/expense/getallexpense",
        params: { limit: 100 },
        enabled,
    });
}

export function useUpdateExpense() {
    return useApiMutation({
        url: "/expense/updateexpense",
        method: "post",
        invalidateKeys: [EXPENSE_QUERY_KEY],
    });
}
