import { useEffect, useState } from "react";
import { useStore } from "../useStore.js";
import { ERROR_API } from "../constants.js";

export const useMidPlatform = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null); // user errors, caller may show them inline or in global error slider

  const { getUser, getToken, setErrorMessage } = useStore();

  const request = async (api, payload, onSuccess) => {
    try {
      setLoading(true);
      setError("");
      setResult(null);
      let user = getUser();
      if (!payload.user_id) payload.user_id = (user && user.id) || "admin";

      const response = await fetch(process.env.REACT_APP_MID_PLATFORM_URL_BASE + "/" + api, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // mode=no-cors时这个不生效，会422报错
          Accept: "application/json",
          Authorization: getToken(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok === false) {
        throw new Error(ERROR_API["network"]);
      }

      if (response.status != 200) {
        // const body = await response.json();
        throw new Error(ERROR_API["server"] + ":" + response.status);
      }

      const json = await response.json();

      if (json.flag < 0) {
        throw new Error(ERROR_API["api"] + ":" + json.flag);
      }
      if (onSuccess) setResult(onSuccess(json));
      else setResult(json.result);
    } catch (err) {
      // non user (validation) errors show in global error slider
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // cancel last fetch
    };
  }, []);

  return { loading, setLoading, result, setResult, request, error, setError };
};
