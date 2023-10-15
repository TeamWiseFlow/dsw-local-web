// 添加到中台，并标记是否索引。添加失败不标记索引，但pb记录仍在。
onRecordAfterCreateRequest((e) => {
  const config = require(`${__hooks}/config.js`);
  const file_dir = config.pb.baseURL + "/api/files/documents/";
  const file_path = `${file_dir}${e.record.id}/${e.record.get("file")}`;

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
  if (res.statusCode !== 200) {
    console.log(JSON.stringify(res, null, 2));
    indexed = false;
  }

  //const record = $app.dao().findRecordById("documents", e.record.get("id"));
  e.record.set("indexed", indexed);
  $app.dao().saveRecord(e.record);
}, "documents");

// 尝试从中台删除，如果成功，再删除pb记录。如果失败，不删除pb记录。
onRecordBeforeDeleteRequest((e) => {
  const config = require(`${__hooks}/config.js`);
  // const file_dir = config.pb.baseURL + "/api/files/documents/";
  const file_name = e.record.get("file");
  console.log("file to delete:", file_path);
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

  if (res.statusCode !== 200) {
    console.log(JSON.stringify(res, null, 2));
    e.record.set("indexed", false);
    $app.dao().saveRecord(e.record);
    throw new Error("中台删除文件失败");
  }
  // proceed normal deletion by return nil
  return true;
}, "documents");
