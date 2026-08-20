import { createContext } from "react";
import { useGetAllStockGroup } from "../hooks/useStockGroup";

export const StockGroupContext = createContext(undefined);

// Stable fallback — a fresh `[]` every render breaks usePagination's
// identity check and causes an infinite setState-during-render loop.
const EMPTY_GROUPS = [];

export const useStockGroupContext = () => {
    const {
        data: stockGroupResponse,
        isLoading: stockGroupLoading,
        isError: isStockGroupError,
        error: stockGroupError,
    } = useGetAllStockGroup();

    const stockGroup = stockGroupResponse?.data ?? EMPTY_GROUPS;

    return { stockGroup, stockGroupLoading, isStockGroupError, stockGroupError };
};
