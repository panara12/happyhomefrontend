import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

// The backend paginates this endpoint server-side (default limit: 10), but
// this list feeds a plain <select> dropdown, not a paginated listing —
// request the backend's max page size so the dropdown isn't silently
// truncated to the first 10 stock groups.

const STOCK_GROUP_KEY = ["stock_group"]

export function useGetAllStockGroup() {
    return useApiQuery({
        queryKey: STOCK_GROUP_KEY,
        path: "/stockgroup/getallstockgroup",
        params: { limit: 100 },
    });
}

export function useAddStockGroup(){
    return useApiMutation({
        url:"/stockgroup/addstockgroup",
        method: "post",
        invalidateKeys: [STOCK_GROUP_KEY]
    })
}

export function useUpdateStockGroup(){
    return useApiMutation({
            url:(variables) => `/stockgroup/updatestockgroup/${variables.id}`,
            method: "post",
            invalidateKeys: [STOCK_GROUP_KEY]
        })
}

export function useDeleteStockGroup(){
    return useApiMutation({
            url:(id) => `/stockgroup/deletestockgroup/${id}`,
            method: "delete",
            invalidateKeys: [STOCK_GROUP_KEY]
        })
}
