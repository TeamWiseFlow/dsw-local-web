

onRecordAfterCreateRequest((e) => {

    // console.log(JSON.stringify(e.uploadedFiles.file[0]))
    const FILE_DIR = 'http://localhost:8090/api/files/documents/'
    const file_path = `${FILE_DIR}${e.record.id}/${e.record.get('file')}`

    console.log('uploaded file:', file_path)

})


onRecordBeforeDeleteRequest((e) => {

    //console.log(JSON.stringify(Object.keys(e.record), null, 2));

    const FILE_DIR = 'http://localhost:8090/api/files/documents/';
    const file_path = `${FILE_DIR}${e.record.id}/${e.record.get('file')}`

    console.log('deleted file:', file_path);

}, "documents")