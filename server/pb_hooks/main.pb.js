// 添加到中台，并标记是否索引。添加失败不标记索引，但pb记录仍在。
onRecordAfterCreateRequest((e) => {
  const config = require(`${__hooks}/config.js`);

  const file_path = config.pb.baseDir + e.record.collection().id + "/" + e.record.id + "/" + e.record.get("file");
  console.log("file to add:", file_path);
  const admin = e.httpContext.get("admin");
  //   console.log(JSON.stringify(admin, null, 2));
  const res = $http.send({
    url: config.midplatform.baseURL + "/add_file",
    method: "POST",
    body: JSON.stringify({
      user_id: (admin && admin.id) || "admin",
      type: "file",
      content: file_path,
    }),
    headers: { "content-type": "application/json" },
    timeout: 120, // in seconds
  });

  let indexed = true;
  let res_json = res.json;
  console.log(JSON.stringify(res_json, null, 2));
  if (res.statusCode !== 200 || res_json.flag < 0) {
    indexed = false;
    // TODO: 如何res_json.result[0].answer错误消息发回给页面？
  }

  e.record.set("indexed", indexed);
  $app.dao().saveRecord(e.record);
}, "documents");

// 尝试从中台删除，如果成功，再删除pb记录。
onRecordBeforeDeleteRequest((e) => {
  const config = require(`${__hooks}/config.js`);
  const file_name = e.record.get("file");
  console.log("file to delete:", file_name);
  const admin = e.httpContext.get("admin");
  //   console.log(JSON.stringify(admin, null, 2));
  const res = $http.send({
    url: config.midplatform.baseURL + "/del_file",
    method: "POST",
    body: JSON.stringify({
      user_id: (admin && admin.id) || "admin",
      type: "file",
      content: file_name,
    }),
    headers: { "content-type": "application/json" },
    timeout: 120, // in seconds
  });

  let res_json = res.json;
  console.log(JSON.stringify(res, null, 2));
  if (res.statusCode !== 200 || res_json.flag < 0) {
    // 不抛出异常，继续删除pb记录
    // e.record.set("indexed", false);
    // $app.dao().saveRecord(e.record);
    //throw new Error("中台删除文件失败");
  }
  // proceed normal deletion by return nil
  return true;
}, "documents");
