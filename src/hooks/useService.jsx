import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const SERVICE_QUERY_KEY = ["service"];

export function useGetAllService() {
    return useApiQuery({
        queryKey: SERVICE_QUERY_KEY,
        path: "/services/getallservice",
        params: { limit: 100 },
    });
}

export function useAddService() {
    return useApiMutation({
        url: "/services/addservice",
        method: "post",
        invalidateKeys: [SERVICE_QUERY_KEY],
    });
}

export function useUpdateService() {
    return useApiMutation({
        url: ({ id }) =>  `/services/updateservice/${id}`,
        method: "post",
        invalidateKeys: [SERVICE_QUERY_KEY],
    });
}
