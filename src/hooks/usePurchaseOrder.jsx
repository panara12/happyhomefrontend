import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const PURCHASE_ORDER_KEY = "purchase-orders"

export function useAddPurchaseOrder() {
    return useApiMutation({
        url: "/purchaseorder/addpurchaseorder",
        method: "post",
        invalidateKeys: [PURCHASE_ORDER_KEY],
    });
}

export function useUpdatePurchaseOrder() {
    return useApiMutation({
        url: (variable) => `/purchaseorder/updatepurchaseorderstatus/${variable.id}`,
        method: "post",
        invalidateKeys: [PURCHASE_ORDER_KEY],
    });
}

// Assuming a useApiQuery utility mirrors useApiMutation — adjust if the real signature differs
export function useGetAllPurchaseOrder() {
    return useApiQuery({
        path: "/purchaseorder/getallpurchaseorder",
        queryKey: PURCHASE_ORDER_KEY,
        params: { limit: 100 },
    });
}