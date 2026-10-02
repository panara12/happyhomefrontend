import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const PURCHASE_ORDER_KEY = "purchase-orders";

export function useAddPurchaseOrder() {
  return useApiMutation({
    url: "/purchaseorder/addpurchaseorder",
    method: "post",
    invalidateKeys: [PURCHASE_ORDER_KEY],
  });
}

export function useEditPurchaseOrder() {
  return useApiMutation({
    url: (variable) => `/purchaseorder/updatepurchaseorder/${variable.id}`,
    method: "put",
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

export function useGetAllPurchaseOrder() {
  return useApiQuery({
    path: "/purchaseorder/getallpurchaseorder",
    queryKey: PURCHASE_ORDER_KEY,
    params: { limit: 100 },
  });
}
