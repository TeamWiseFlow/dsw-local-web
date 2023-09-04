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



## 部署
1、拉代码
git clone git@openi.pcl.ac.cn:DigitalSocialWorker/dsw-web.git

2、安装前端环境

2.1 安装node
wget https://nodejs.org/dist/v16.10.0/node-v16.10.0-linux-x64.tar.xz

tar xvf node-v16.10.0-linux-x64.tar.xz

ln -s /root/node-v16.10.0-linux-x64/bin/node /usr/local/bin/node

ln -s /root/node-v16.10.0-linux-x64/bin/npm /usr/local/bin/npm

3、拉pocketbase服务
wget https://github.com/pocketbase/pocketbase/releases/download/v0.17.7/pocketbase_0.17.
7_linux_amd64.zip

4、把pocketbase 压缩包放到/usr/local/bin目录下并解压
mv -vf pocketbase_0.17.7_linux_amd64.zip /usr/local/bin
cd /usr/local/bin
unzip pocketbase_0.17.7_linux_amd64.zip

5、启动项目
cd ~/dsw-web

5.1 把server移动到 /mnt目录下
mv -vf server /mnt

5.2 启动web
npm install
npm run start

5.3 启动server
cd /mnt/server & pocketbase serve


## 其他指令

查看端口进程：lsof -i :3000
杀死端口进程：kill -9 {id}
