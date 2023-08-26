import { create } from 'zustand'
import PocketBase from 'pocketbase'
import { API_URL_BASE, ERROR_LOGIN } from './constants'
import { filter } from 'lodash'
const pb = new PocketBase(API_URL_BASE)
console.log('init pocketbase')
// pocketbase
const useStore = create((set) => ({

    token: '',
    files: [],
    errorMessage: '',
    login: async (credentials) => {
        try {
            //const userData = await pb.collection('users').authWithPassword(credentials.username, credentials.password)
            const userData = await pb.admins.authWithPassword(credentials.username, credentials.password)
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
    },
    getFiles: async (keyword, filters) => {
        const _exts = filters && filters.ext && filters.ext.length > 0 && filters.ext || ['%']
        const _filename = keyword && keyword != '*' ? `%${keyword}%` : '%'
        const _filter = _exts.map(ext => `filename ~ "${_filename}.${ext}"`).join(' || ')
        // console.log(_filter)
        try {
            const data = await pb.collection('documents').getFullList({
                filter: _filter,
                sort: '-updated'
            })
            console.log(data)

            return data
        } catch (err) {
            //console.log(err.status, err.response)
            return { error: true, status: err.status, ...err.response }
        }
    },
    setErrorMessage: (msg) => {
        set({ errorMessage: msg })
        setTimeout(() => {
            set({ errorMessage: '' })
        }, 3000)
    },
}))
// initial states
useStore.setState({ token: pb.authStore.token || '' })

export { pb, useStore }