# DSW Web

## 0825 dev
## 0826 dev

下载pocketbase: https://pocketbase.io/docs/

二进制文件放到PATH路径下，并chmod可执行

启动pocketbase服务器

```
npm run server
```

启动web端
```
npm start
```

使用管理员账户登录：admin@dsw.cn / admin00001111


注意：
提交代码前，先停止pocketbase服务，避免提交多余文件。
pb的数据库、migration、文件目前都会提交，方便调试。
上传的都是0KB文件仅测试。

----
## 9.10 milestone 开发

- 后端，用户认证，文件管理/搜索，开发api服务
- 前端React开发
- 登录组件
- 入口页面，看有无合适模版，简单的话使用React Router搭建
- 财政小助手
- 图书馆（文件管理），先测试独立安装的web文件管理，候选：
    - https://filebrowser.org/
    - https://www.filestash.app/


## 10.15 milestone

 - 管理员页面，管理用户
 - 图书馆功能完善（第三方软件则选择功能完善的）


## 10.30 milestone

 - 财政GPT功能：尝试利用chatgpt前端模版
 - 如财政小助手也可用聊天交互方式，也可以用以上模版（用不同插件区别？）