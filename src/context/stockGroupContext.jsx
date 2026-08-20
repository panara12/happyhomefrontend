import { createContext } from "react";
import { useGetAllStockGroup } from "../hooks/useStockGroup";

export const StockGroupContext = createContext(undefined);

export const useStockGroupContext = () =>{
    const {
            data: stockGroupResponse,
            isLoading: stockGroupLoading,
            isError: isStockGroupError,
            error: stockGroupError,
        } = useGetAllStockGroup();
    const stockGroup = stockGroupResponse?.data ?? [];

    return { stockGroup, stockGroupLoading, isStockGroupError, stockGroupError }
}