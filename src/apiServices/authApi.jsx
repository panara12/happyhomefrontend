import { useDispatch } from "react-redux";
import apiHelper from "./config";

const authApiService = {
    login : (payload) => apiHelper.post('/auth/login',{username:payload.username,password:payload.password}),
    getMe : async () => await apiHelper.get('/auth/me'),
    logout: () => apiHelper.get('/auth/logout')
}

export default authApiService