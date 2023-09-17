import { FILE_PATH } from '../constants'
// const fullPath = path.join(__dirname, FILE_PATH)

// const path = require('path')
// Example POST method implementation:
const colectionUrl = 'http://47.98.147.178:7777/budget_analysis'

const newColectionUrl = 'http://47.98.147.178:7777/new_budget_analysis'

export async function collection(data, type) {

    // Default options are marked with *
    const paths = data?.map(i => `${FILE_PATH}/${i.collectionId}/${i.id}/${i.file}`)
    console.log('paths', paths)
    const response = await fetch(type === 'new' ? newColectionUrl : colectionUrl, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        // mode: "no-cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json",
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify({ filelist: paths }), // body data type must match "Content-Type" header
    });
    console.log('response', response)
    const res = response.json();
    return res; // parses JSON response into native JavaScript objects
}

// postData("https://example.com/answer", { answer: 42 }).then((data) => {
//     console.log(data); // JSON data parsed by `data.json()` call
// });