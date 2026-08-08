import ApiHelper from "./config";

const stockGroupApiService = {
    getAllStockGroup : ()=> ApiHelper.get('/stockgroup/getallstockgroup')
    
}

export default stockGroupApiService;