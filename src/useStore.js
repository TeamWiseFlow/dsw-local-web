import { create } from 'zustand'
import PocketBase from 'pocketbase'
import { API_URL_BASE, ERROR_LOGIN } from './constants'
const pb = new PocketBase(API_URL_BASE)
console.log('init pocketbase')
// pocketbase
const useStore = create((set) => ({

    token: '',
    login: async (credentials) => {
        try {
            const userData = await pb.collection('users').authWithPassword(credentials.username, credentials.password)
            // console.log(userData) // TODO: save user name?

            set({ token: userData.token })
            localStorage.setItem('token', userData.token);
            return userData
        } catch (err) {
            return { error: true, ...err.response }
        }
    },
    logout: () => {
        console.log('logout')
        set({ token: '' })
        localStorage.setItem('token', '')
    }

}))

useStore.setState({ token: localStorage.getItem('token') || '' })

export { pb, useStore }