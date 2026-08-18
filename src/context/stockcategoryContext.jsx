import { createContext } from "react";
import { useGetAllStockCategory } from "../hooks/useStockCategory";

export const StockCategoryContext = createContext(undefined);

export const useStockCategoryContext = () =>{
    const {
            data: stockCategoryResponse,
            isLoading: stockCategoryLoading,
            isError: isStockCategoryError,
            error: stockCategoryError,
        } = useGetAllStockCategory();
    const stockCategory = stockCategoryResponse?.data ?? [];

    return { stockCategory, stockCategoryLoading, isStockCategoryError, stockCategoryError }
}