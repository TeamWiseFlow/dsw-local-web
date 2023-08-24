// server side code to handle file find, using express.js
// query parameters: keyword, rootDir, filters

const express = require('express');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const router = express.Router();

router.post('/find', express.json(), cors(), (req, res) => {
    let { keyword, rootDir, filters } = req.body;

    rootDir = rootDir || process.env.ROOT_DIR
    filters = filters || { 'ext': ['xlsx', 'xls'] }

    let ext = `{${filters.ext.join(',')}}`;
    let name = keyword == '*' ? '*.' + ext : `*${keyword}*.` + ext;

    let globPattern = path.join(rootDir, '**', name);
    // console.log(globPattern)
    let files = glob.sync(globPattern);
    let fileList = [];
    files.forEach(file => {
        let stat = fs.statSync(file);
        fileList.push({
            name: file,
            size: stat.size,
            modified: stat.mtime
        })
    })
    console.log(fileList)
    res.send(fileList);
});

router.post('/login', express.json(), cors(), (req, res) => {
    if (!req.body.username || !req.body.password) {
        res.status(400).send({
            error: '用户名或密码不能为空'
        })
        return
    }

    if (req.body.username !== 'admin' || req.body.password !== 'admin') {
        res.status(401).send({
            error: '用户名或密码错误'
        })
        return
    }

    res.send({
        token: 'test123'
    })
});

// start server
const app = express();
app.use(cors());
app.use(router);

app.listen(3001, () => console.log('server started'));
