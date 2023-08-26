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
            return userData
        } catch (err) {
            return { error: true, status: err.status, ...err.response }
        }
    },
    logout: () => {
        console.log('logout')
        pb.authStore.clear()
        set({ token: '' })
    }

}))
// initial states
useStore.setState({ token: pb.authStore.token || '' })

export { pb, useStore }