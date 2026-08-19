import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const PURCHASE_BILL_KEY = "purchase-bills"

export function useAddPurchaseBill() {
    return useApiMutation({
        url: "/purchasebill/addpurchasebill",
        method: "post",
        invalidateKeys: [PURCHASE_BILL_KEY],
    });
}

// Assuming a useApiQuery utility mirrors useApiMutation — adjust if the real signature differs
export function useGetAllPurchaseBill() {
    return useApiQuery({
        path: "/purchasebill/getallpurchasebill",
        queryKey: PURCHASE_BILL_KEY,
        params: { limit: 100 },
    });
}