// api end points
export const API_URL_BASE = 'http://localhost:8090'
export const API_URL_LOGIN = API_URL_BASE + '/login'
export const API_URL_FILE = API_URL_BASE + '/api/files/documents/'

// error messages
export const ERROR_LOGIN = {
    'empty': '用户名或密码不能为空',
    0: '无法连接服务器或连接中断',
    400: '用户名或密码错误',
}

export const ERROR_HTTP = {
    0: '无法连接服务器或连接中断',
    400: '无权限的操作'
}

// style constants
export const STYLE_CONFIG = {
    padding: 10,
}