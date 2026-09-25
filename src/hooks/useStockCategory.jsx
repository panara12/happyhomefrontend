import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const STOCK_CATEGORY_KEY = ["stock_category"];


export function useGetAllStockCategory() {
    return useApiQuery({
        queryKey: STOCK_CATEGORY_KEY,
        path: "/stockcategory/getallstockcategory",
        params: { limit: 100 },
    });
}

export function useAddStockCategory() {
    return useApiMutation({
        url: "/stockcategory/addstockcategory",
        method: "post",
        invalidateKeys: [STOCK_CATEGORY_KEY],
    });
}

export function useUpdateStockCategory() {
    return useApiMutation({
        url: "/stockcategory/updatestockcategory",
        method: "post",
        invalidateKeys: [STOCK_CATEGORY_KEY],
    });
}

export function useDeleteStockCategory(){
    return useApiMutation({
        url: (categoryId) => `/stockcategory/deletestockcategory/${categoryId}`,
        method: 'delete',
        invalidateKeys: [STOCK_CATEGORY_KEY],
    })
}