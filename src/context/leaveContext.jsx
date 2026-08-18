import { createContext } from "react";
import { useGetAllLeaves } from "../hooks/useLeave";

export const LeaveContext = createContext(undefined);

export const useLeaveContext = () =>{
    const {
            data: leaveResponse,
            isLoading: leaveLoading,
            isError: isLeaveError,
            error: leaveError,
        } = useGetAllLeaves();
    const leaves = leaveResponse?.leaves ?? [];

    return { leaves, leaveLoading, isLeaveError, leaveError }
}