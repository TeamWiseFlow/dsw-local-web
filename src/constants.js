// api end points
export const API_URL_BASE = 'http://localhost:8090'

export const API_URL_LOGIN = API_URL_BASE + '/login'
export const API_URL_FILE = API_URL_BASE + '/find'

// error messages
export const ERROR_LOGIN = {
    'empty': '用户名或密码不能为空',
    400: '用户名或密码错误',
}