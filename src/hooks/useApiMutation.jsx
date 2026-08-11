import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import http from "../apiServices/http.service";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * Standard write hook (POST/PUT/PATCH/DELETE) built on top of http.service —
 * handles cache invalidation, success/error toasts, and post-success redirects
 * in one place instead of every mutation re-wiring the same boilerplate.
 *
 * @param {object} options
 * @param {string | ((variables: any) => string)} [options.url] Required unless `mutationFn` is supplied.
 * @param {"post"|"put"|"patch"|"delete"} [options.method="post"]
 * @param {(variables: any) => Promise<any>} [options.mutationFn] Escape hatch for endpoints that don't fit the url+method shape (e.g. a backend route that mutates on GET) — bypasses `url`/`method` entirely.
 * @param {import("@tanstack/react-query").QueryKey[]} [options.invalidateKeys]
 * @param {boolean} [options.showErrorToast=true]
 * @param {string} [options.successMessage]
 * @param {string} [options.redirectTo]
 * @param {(data: any, queryClient: import("@tanstack/react-query").QueryClient) => void | Promise<void>} [options.onSuccess]
 */
export function useApiMutation({
  url,
  method = "post",
  mutationFn: customMutationFn,
  invalidateKeys,
  showErrorToast = true,
  successMessage,
  redirectTo,
  onSuccess,
  ...options
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutationFn =
    customMutationFn ??
    ((variables) => {
      const resolvedUrl = typeof url === "function" ? url(variables) : url;
      if (method === "delete") {
        // Only object variables become a body; a bare id already sits in the URL
        const body =
          variables !== null && typeof variables === "object"
            ? variables
            : undefined;
        return http.del(resolvedUrl, body);
      }
      return http[method](resolvedUrl, variables);
    });

  return useMutation({
    ...options,
    mutationFn,
    onSuccess: async (data) => {
      if (successMessage) {
        toast.success(successMessage);
      }
      if (invalidateKeys?.length) {
        await Promise.all(
          invalidateKeys.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          ),
        );
      }
      await onSuccess?.(data, queryClient);
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      }
    },
    onError: (error) => {
      if (showErrorToast) {
        toast.error(error?.message || DEFAULT_ERROR_MESSAGE);
      }
    },
  });
}
