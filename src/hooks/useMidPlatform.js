import { useEffect, useState } from "react";
import { useStore } from "../useStore.js";

const post = async (api, payload) => {
  try {
    
    let response = await fetch(process.env.REACT_APP_MID_PLATFORM_URL_BASE + "/" + api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // mode=no-cors时这个不生效，会422报错
        Accept: "application/json",
      },
      body: oldVersion
        ? JSON.stringify({ files: paths })
        : JSON.stringify({
            user_id: user_id,
            type: "file",
            content: paths[0],
          }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    console.log(JSON.stringify(response));
    const result = await response.json();
    return result;
  } catch (err) {
    console.log("err", err);
  }
}


export const useMidPlatform = (api, payload, onJSON) => {
  const [result, setResult] = useState("");
  const { getUser } = useStore();

  useEffect(() => {
    let user = getUser()
    if(!payload.user_id) payload.user_id = user && user.id || "admin"

    post(api, payload)
    
  }, []);

  return result;
};
