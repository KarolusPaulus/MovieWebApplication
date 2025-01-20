import { useState } from "react";
import { UserContext } from "./UserContext.js";
import axios from "axios";

const url = process.env.REACT_APP_BACKEND_CONNECTION

export default function UserProvider({children}) {
    const userFromSessionStorage = sessionStorage.getItem('user')
    const [user, setUser] = useState(userFromSessionStorage ? JSON.parse(userFromSessionStorage): {email: '', password: ''})

    const signUp = async () => {
        const json = JSON.stringify(user)
        const headers = { headers: { 'Content-Type': 'application/json' } }
        try {
            await axios.post(url + '/user/register', json, headers)
            setUser({ email: '', password: '' })
        } catch (error) {
            throw error
        }
    }

    const signIn = async () => {
        const json = JSON.stringify(user)
        const headers = { headers: { 'Content-Type': 'application/json' } }
        try {
            const response = await axios.post(url + '/user/login', json, headers)
            const loggedInUser = response.data

            sessionStorage.setItem('user', JSON.stringify(loggedInUser))
            setUser(loggedInUser)
        } catch (error) {
            throw error
        }
    }

    const signOut = () => {
        setUser({ email: '', password: '' })
        sessionStorage.removeItem('user')
    }

    const deleteAccount = async () => {
        try {
            const response = await axios.delete(url + '/user/delete', {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            })
            return response.data
            
        } catch (error) {
            throw error
        }
    }

    return (
        <UserContext.Provider value={{ user, setUser, signUp, signIn, signOut, deleteAccount }}>
            { children }
        </UserContext.Provider>
    )
}