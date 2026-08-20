import { createContext } from "react";
import { useGetAllStockCategory } from "../hooks/useStockCategory";

export const StockCategoryContext = createContext(undefined);

// Stable fallback — a fresh `[]` every render breaks usePagination's
// identity check and causes an infinite setState-during-render loop.
const EMPTY_CATEGORIES = [];

export const useStockCategoryContext = () => {
    const {
        data: stockCategoryResponse,
        isLoading: stockCategoryLoading,
        isError: isStockCategoryError,
        error: stockCategoryError,
    } = useGetAllStockCategory();

    const stockCategory = stockCategoryResponse?.data ?? EMPTY_CATEGORIES;

    return { stockCategory, stockCategoryLoading, isStockCategoryError, stockCategoryError };
};
