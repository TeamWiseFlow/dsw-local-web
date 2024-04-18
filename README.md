# DSW Local Web

这个项目立项于2023年8月，最初的想法是打造完全内网部署（即完全隔离外网）的企业内部知识库和工作流平台，主要应用于大型企事业单位和政务办公领域。

2023年9月与合作伙伴尝试应用于某地财政局，第一阶段完成后，因合作伙伴原因，项目终止，加之后续dsw团队注意力愈发集中在社交平台机器人和行业信息情报采集方向，因此本项目后两个阶段的开发一直没有启动……

目前项目前端web部分还是比较完善的，但backend部分的scholar模块建议重构开发。

考虑项目定位，llm service我们推荐使用internLM提供的本地模型部署加速框架搭配阿里通义千问1.5系列，具体参考： https://github.com/InternLM/lmdeploy

在backend/llms 目录中，我们提供了部署脚本和wrapper示例代码，但是并未完成与后端主流程代码（dm.py)的整合。

## 基于本项目现阶段的项目demo

https://openi.pcl.ac.cn/WiseFlow/dsw-web/src/branch/master/assets/%e7%bb%8d%e5%85%b4%e8%b4%a2%e6%94%bf%e5%b1%80demo.mp4

## roadmap

对于本项目，或者说该类型的应用场景，应该着眼于如下三个方面的深入开发：

1、文档智能 —— 更加智能的处理各种类型文档，尤其是复杂文档的ocr、layout解析等。本项目代码仓对应 backend/scholar/document process

2、RAG —— 不过这一块有很多优秀的开源项目，学术界目前进展也很蓬勃。本项目代码仓对应 backend/scholar

以上两块其实我理解行业会不断涌现出优秀的作业，大家借鉴就好，但第三点可能是需要致力于这个业务方向的同学特别思考的

3、符合信创要求的llm本地部署和加速方案 —— 有外网隔离要求的业务场景大部分可能都是国企、政务了，“信创”要求是早晚躲不过的……这方面我个人认为应该特别关注基于arm架构的cpp迁移方案，目前行业内也有不少开源方案可供参考。

**最后提醒：本项目遵循Apache 2.0协议，基于本项目的二次开发可以商用，但二次开发部分依然需要开源，欢迎各路大神对本项目进行PR！**


## 0905 deployment

部署:
```
npm run build
npm run tar
npm run deploy
```

以上第三步需要caprover cli。

也可不安装cli，登录caprover后台网页，找到dsw-web应用，在depoyment标签页里，上传deploy.tar即可。

caprover后台：
```
http://47.98.147.178:3000/
```
密码: dsw2024admin

dsw-web应用，就是简单的一个docker image，包括了nginx的静态网站配置。

使用cli:
安装配置CLI： https://caprover.com/docs/get-started.html

```
caprover login
```
地址需要输入：http://captain.dswsx.io2xp.cn
密码如上


dsw-web网站, http://47.98.147.178:3001 

pocketbase使用systemd部署成服务, http://47.98.147.178:8090/_/


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
