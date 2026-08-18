import { useApiMutation } from "./useApiMutation";

export function useSubmitSampleInvoice() {
  return useApiMutation({
    url: "/invoices/submit-sample",
    method: "post",
    successMessage: "Invoice submitted successfully",
  });
}
