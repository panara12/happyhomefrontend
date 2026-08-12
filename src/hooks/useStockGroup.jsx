import { useApiQuery } from "./useApiQuery";

// The backend paginates this endpoint server-side (default limit: 10), but
// this list feeds a plain <select> dropdown, not a paginated listing —
// request the backend's max page size so the dropdown isn't silently
// truncated to the first 10 stock groups.
export function useGetAllStockGroup() {
    return useApiQuery({
        queryKey: ["stockGroup"],
        path: "/stockgroup/getallstockgroup",
        params: { limit: 100 },
    });
}
