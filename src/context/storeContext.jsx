import { createContext } from "react";
import { useGetAllStores } from "../hooks/useStore";

export const StoreContext = createContext(undefined);

export const useStoreContext = () =>{
    const {
            data: storeResponse,
            isLoading: storeLoading,
            isError: isStoreError,
            error: storeError,
        } = useGetAllStores();
    const stores = storeResponse?.stores ?? [];
    const managers = storeResponse?.managers ?? [];

    return { stores, managers, storeLoading, isStoreError, storeError }
}