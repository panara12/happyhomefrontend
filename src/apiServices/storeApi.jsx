import apiHelper from "./config";

const storeApiService = {
    addStore : (payload) => apiHelper.post('/stores/addstore',payload),
    updateStore : (payload) => apiHelper.post('/stores/updatestore', payload),
    getAllStores: () => apiHelper.get('/stores/getAllStores').then((res) => res.data),

}
export default storeApiService