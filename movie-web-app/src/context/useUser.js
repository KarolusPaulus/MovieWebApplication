import { useContext } from "react";
import { UserContext } from "./UserContext.js";

export const useUser = () => {
    return useContext(UserContext)
}