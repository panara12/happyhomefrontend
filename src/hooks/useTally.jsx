import { toast } from "sonner";
import { useApiMutation } from "./useApiMutation";
import { STORE_INVOICES_KEY } from "./useInvoice";

const PURCHASE_BILL_KEY = "purchase-bills";
const PRODUCTS_QUERY_KEY = ["products"];

/**
 * Manually drain pending invoice vouchers + purchase-bill stock items into Tally.
 * Requires permission: sync_tally_pending
 */
export function useSyncPendingTally() {
  return useApiMutation({
    url: "/tally/sync-pending",
    method: "post",
    invalidateKeys: [STORE_INVOICES_KEY, PURCHASE_BILL_KEY, PRODUCTS_QUERY_KEY],
    onSuccess: (data) => {
      const invoices = data?.invoices;
      const products = data?.products;
      const invSynced = invoices?.synced ?? 0;
      const prodSynced = products?.synced ?? 0;
      toast.success(
        data?.message
          ? `${data.message} (invoices: ${invSynced}, products: ${prodSynced})`
          : "Pending Tally sync completed"
      );
    },
  });
}
