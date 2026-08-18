import { useApiQuery } from "./useApiQuery";

const PRODUCTS_QUERY_KEY = ["products"];

// Single endpoint — no ?q → paginated list, ?q=text → search results
export function useGetAllProducts(query = '') {
    return useApiQuery({
        queryKey: [...PRODUCTS_QUERY_KEY, query],
        path: "/products/getAllProducts",
        params: query ? { q: query } : { limit: 100 },
    });
}
