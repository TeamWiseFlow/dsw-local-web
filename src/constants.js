// api end points
export const API_URL_BASE = 'http://localhost:8090'
// export const API_URL_BASE = 'http://47.98.147.178:8090'
export const API_URL_LOGIN = API_URL_BASE + '/login'
export const API_URL_FILE = API_URL_BASE + '/api/files/documents/'

// file extensions
export const FILE_EXT = {
    'xls': 'Excel',
    'xlsx': 'Excel',
    'doc': 'Word',
    'docx': 'Word',
    'pdf': 'Pdf',
    'ppt': 'Ppt',
    'pptx': 'Ppt',
    'txt': 'Txt',
    'csv': 'Csv',
}

// error messages
export const ERROR_LOGIN = {
    'empty': '用户名或密码不能为空',
    0: '无法连接服务器或连接中断',
    400: '用户名或密码错误',
}

export const ERROR_HTTP = {
    0: '无法连接服务器或连接中断',
    400: '无权限的操作',
    'validation_not_unique': '记录已存在，操作取消'
}

// style constants
export const STYLE_CONFIG = {
    padding: 10,
}