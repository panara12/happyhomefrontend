import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";
import http from "../apiServices/http.service";

const PRODUCTS_QUERY_KEY = ["products"];

// Single endpoint — no ?q → paginated list, ?q=text → search results
export function useGetAllProducts(query = '', { fetchAll = false } = {}) {
    return useApiQuery({
        queryKey: [...PRODUCTS_QUERY_KEY, query, fetchAll ? 'all-pages' : 'first-page'],
        path: "/products/getAllProducts",
        params: query ? { q: query } : { limit: 100 },
        ...(fetchAll && !query ? {
            queryFn: async () => {
                const limit = 100;
                const firstPage = await http.get("/products/getAllProducts", { params: { page: 1, limit } });
                const products = [...(firstPage?.products || [])];
                const totalPages = Math.max(1, Number(firstPage?.pagination?.totalPages) || 1);

                for (let page = 2; page <= totalPages; page += 1) {
                    const response = await http.get("/products/getAllProducts", { params: { page, limit } });
                    products.push(...(response?.products || []));
                }

                return { ...firstPage, products };
            },
        } : {}),
    });
}

export function useGetProductBySku() {
    return useApiMutation({
        mutationFn: (sku) => http.get(`/products/sku/${encodeURIComponent(sku)}`),
        showErrorToast: false,
    });
}

export function useAddProduct() {
    return useApiMutation({
        url: "/products/addproduct",
        method: "post",
        invalidateKeys: [PRODUCTS_QUERY_KEY],
        successMessage: "Product added successfully",
    });
}

export function useUpdateProduct() {
    return useApiMutation({
        url: (variables) => `/products/updateproduct/${variables.id}`,
        method: "put",
        invalidateKeys: [PRODUCTS_QUERY_KEY],
        successMessage: "Product updated successfully",
    });
}

export function useDeleteProduct() {
    return useApiMutation({
        url: (id) => `/products/deleteproduct/${id}`,
        method: "delete",
        invalidateKeys: [PRODUCTS_QUERY_KEY],
        successMessage: "Product deleted successfully",
    });
}
