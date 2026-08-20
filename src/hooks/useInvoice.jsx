import { useApiMutation } from "./useApiMutation";

export function useSubmitInvoice() {
  return useApiMutation({
    url: "/invoices/invoice-submit",
    method: "post",
    successMessage: "Invoice submitted successfully",
  });
}
