import { create } from "zustand";
import PocketBase from "pocketbase";
import { ERROR_LOGIN, ERROR_HTTP } from "./constants";
const pb = new PocketBase(process.env.REACT_APP_API_URL_BASE);
console.log("init pocketbase @", process.env.REACT_APP_API_URL_BASE, process.env.NODE_ENV);
// pocketbase
const useStore = create((set, get) => ({
  token: "",
  files: [],
  errorMessage: "",
  login: async (credentials) => {
    try {
      //const userData = await pb.collection('users').authWithPassword(credentials.username, credentials.password)
      const userData = await pb.admins.authWithPassword(credentials.username, credentials.password);
      // console.log(userData) // TODO: save user name?
      set({ token: userData.token });
      return userData;
    } catch (err) {
      return { error: true, status: err.status, ...err.response };
    }
  },
  logout: () => {
    console.log("logout");
    pb.authStore.clear();
    set({ token: "" });
  },
  getFiles: async (keyword, filters) => {
    const _exts = (filters && filters.ext && filters.ext.length > 0 && filters.ext) || ["%"];
    const _filename = keyword && keyword != "*" ? `%${keyword}%` : "%";
    const _filter = _exts.map((ext) => `filename ~ "${_filename}.${ext}"`).join(" || ");
    // console.log(_filter)
    try {
      const data = await pb.collection("documents").getFullList({
        filter: _filter,
        sort: "-updated",
      });
      // console.log(data)
      return data;
    } catch (err) {
      if (err.isAbort) return;
      console.log(err.status, err.response, err.isAbort);
      get().setErrorMessage(ERROR_HTTP[err.status] || ERROR_HTTP[0]);
      return { error: true, status: err.status, ...err.response };
    }
  },
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", file.name);
    try {
      // 如果依赖数据库index unique约束filename，会正常报错，不会新建记录，但文件仍然会传到storage目录，污染目录下文件。
      // 因此手动检查同名文件是否已存在，如果存在直接报错。
      const res = await pb.collection("documents").getFullList({
        filter: `filename = "${file.name}"`,
      });
      let exists = res.find((f) => f.filename == file.name);
      if (exists) {
        console.log("file exists");
        throw { response: { data: { file: { code: "validation_not_unique" } } } };
      }
      const createdRecord = await pb.collection("documents").create(formData);
      return createdRecord;
    } catch (err) {
      if (err.isAbort) return;
      // console.log(JSON.stringify(err, null, 2))
      if (err.response.data && err.response.data.file && err.response.data.file.code == "validation_not_unique") {
        get().setErrorMessage(ERROR_HTTP[err.response.data.file.code] || err.response.data.file.message);
      } else {
        get().setErrorMessage(ERROR_HTTP[err.status] || ERROR_HTTP[0]);
      }
      return { error: true, status: err.status, ...err.response };
    }
  },
  deleteFile: async (id) => {
    try {
      // await pb.collection('documents').update(id, {'file':null})
      await pb.collection("documents").delete(id);
    } catch (err) {
      if (err.isAbort) return;
      console.log(JSON.stringify(err, null, 2));
      if (err.response.data && err.response.data.file && err.response.data.file.code) {
        get().setErrorMessage(ERROR_HTTP[err.response.data.file.code] || err.response.data.file.message);
      } else {
        get().setErrorMessage(ERROR_HTTP[err.status] || ERROR_HTTP[0]);
      }
      return { error: true, status: err.status, ...err.response };
    }
  },
  dm: async (question) => {
    if (!question) return;
    const API_URL = process.env.REACT_APP_MID_PLATFORM_URL_BASE + "/dm";

    try {
      let response = await fetch(API_URL, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        headers: {
          "Content-Type": "application/json", // mode=no-cors时这个不生效，会422报错
          Accept: "application/json",
        },
        body: JSON.stringify({
          user_id: pb.authStore.model.id,
          type: "text",
          content: question,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.log("err", err);
    }
  },
  setErrorMessage: (msg) => {
    set({ errorMessage: msg });
    setTimeout(() => {
      set({ errorMessage: "" });
    }, 3000);
  },
}));
// initial states
useStore.setState({ token: pb.authStore.token || "" });

export { pb, useStore };
