import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import authApiService from "../apiServices/authApi";
import { setUserInfo } from "../store/slice/appSlice";


export function useLogin() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: authApiService.login,
        onSuccess: (res)=>{
            dispatch(setUserInfo(res.data.user));
            navigate(`/${res.data.user.userType}/dashboard`)
        },
        onError: (err)=>{
            console.log(err)
            navigate('/login');
        }

    })

}

export function useGetLoggedUser(){
    return useQuery({
        queryKey:['currentUser'],
        queryFn:()=>authApiService.getMe(),
    })
}

export function useLogout(){
    const dispatch = useDispatch();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: authApiService.logout,
        onSuccess: (res)=>{
            dispatch(setUserInfo(null));
            navigate(`/login`)
        },
        onError: (err)=>{
            console.log(err)
            navigate('/login');
        }

    })
}