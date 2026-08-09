import { createContext } from "react";
import { useGetLoggedUser } from "../hooks/useAuth";

export const LoggedUserContext = createContext(undefined);

export const useLoggedUserContext = () =>{
    const {
            data: loggedUserResponse,
            isLoading: loggedUserLoading,
            isError: isLoggedUserError,
            error: loggedUserError,
        } = useGetLoggedUser();
    const loggedUser = loggedUserResponse?.user ?? [];

    return { loggedUser, loggedUserLoading, isLoggedUserError, loggedUserError }
}