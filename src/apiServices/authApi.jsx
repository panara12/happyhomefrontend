import apiHelper from "./config";

const authApiService = {
    login : (payload) => apiHelper.post('/auth/login',{username:payload.username,password:payload.password})
}

export default authApiService