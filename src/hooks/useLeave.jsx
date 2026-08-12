import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const LEAVES_QUERY_KEY = ["leaves"];

// The backend paginates this endpoint server-side (default limit: 10) and
// already scopes results to what the logged-in user is allowed to see
// (admin: all, manager: their store, sales/accounting: their own leaves) —
// request the backend's max page size since this list is paginated client-side.
//
// `enabled` defaults to true but callers behind a tab/accordion should pass
// `enabled: false` until that section is actually shown, so this doesn't
// fire on every page load regardless of which tab is active.
export function useGetAllLeaves({ enabled = true } = {}) {
    return useApiQuery({
        queryKey: LEAVES_QUERY_KEY,
        path: "/leave/getallleave",
        params: { limit: 100 },
        enabled,
    });
}

export function useUpdateLeave() {
    return useApiMutation({
        url: "/leave/updateleave",
        method: "post",
        invalidateKeys: [LEAVES_QUERY_KEY],
    });
}
