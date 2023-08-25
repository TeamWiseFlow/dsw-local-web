import { useState } from 'react'

export default function useToken() {
    const getToken = () => {
        return localStorage.getItem('token')
        // const tokenString = localStorage.getItem('token')
        // const userToken = JSON.parse(tokenString)
        // return userToken?.token
    };

    const [token, setToken] = useState(getToken());

    const saveToken = userToken => {
        localStorage.setItem('token', userToken);
        setToken(userToken);
    };

    return [
        token,
        saveToken
    ]
}