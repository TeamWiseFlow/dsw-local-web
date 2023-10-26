import { useState } from "react";
import styled from "styled-components";
import { Button } from "../components/Common";
import Icons from "../components/Icons";
import SearchFile from "../components/SearchFile";
import { useComponentVisible } from "../components/Common";
import { useStore } from "../useStore";
import { ERROR_API } from "../constants";
import Loading from "../components/Loading";

const Container = styled.div`
  overflow-y: scroll;
`;

const Header = styled.div`
  padding: 20px 40px;
`;

const Content = styled.div`
  padding: 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const SelectResult = styled.div`
  margin: 20px 0;
  color: #393232;

  background-color: #ffefdd;
  padding: 10px;
  border-radius: 5px;
`;

const Result = styled.div`
  margin: 20px 0;
  width: 100%;

  & hr {
    margin-bottom: 1.2rem;
  }
`;

const Link = styled.a`
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  cursor: pointer;
  text-decoration: none;
  background-color: #ffefdd;
  padding: 12px 20px;
  border-radius: 10px;

  & svg {
    width: 30px;
    height: 30px;
    display: inline-block;
  }

  &:hover {
    text-decoration: underline;
  }
`;

const LinkText = styled.span`
  margin-left: 10px;
  color: #393232;
  text-decoration: none;
  underline: none;
`;

const Modal = styled.div`
  position: absolute;
  width: 500px;
  height: auto;
`;

const Text = styled.div`
  margin-top: 20px;
  padding: 10px 20px;
  color: #393232;
`;

const run = async (user_id, list, oldVersion = false) => {
  const API_URL = process.env.REACT_APP_MID_PLATFORM_URL_BASE + (oldVersion ? "/2022_budget_analysis" : "/new_budget_analysis");
  const paths = list.map((i) => `${process.env.REACT_APP_CMS_FILE_DIR}/${i.collectionId}/${i.id}/${i.file}`);

  try {
    let response = await fetch(API_URL, {
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
};

export default function BudgetAnalysis({ oldVersion = false }) {
  const { setErrorMessage, getUser } = useStore();
  let [files, setFiles] = useState([]);
  let [resultFile, setResultFile] = useState("");
  let [resultText, setResultText] = useState("");
  let [loading, setLoading] = useState(false);

  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);

  const openSearch = () => {
    setIsComponentVisible(true);
  };

  const selectFiles = (files) => {
    if (!files || files.length == 0) {
      setFiles([]);
    } else {
      setFiles(files);
    }
  };

  const onSubmit = async () => {
    setLoading(true);
    let user = getUser();
    const res = await run((user && user.id) || "admin", files, oldVersion);
    if (!res) {
      setErrorMessage("服务器错误");
      setLoading(false);
      return;
    }
    const { flag, result } = res;

    if (flag < 0) {
      setErrorMessage(ERROR_API["error"] + ":" + flag);
    } else if (flag === 21 && result.length == 2 && result[1].type == "file") {
      setResultFile(`${process.env.REACT_APP_RESULT_URL}${result[1].answer}`);
      setResultText((result[2] && result[2].answer) || "");
    } else if (flag === 1) {
      setErrorMessage("输入的文件路径不对");
    } else if (flag === 2) {
      setErrorMessage("计算错误");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Header>
        <h1>新集采统计工具</h1>
      </Header>
      <Content>
        <Button style={{ cursor: "pointer" }} onClick={openSearch}>
          {files.length == 0 ? "选择文件" : "重新选择"}
        </Button>
        {files.length > 0 ? (
          <SelectResult>
            {files.length > 0 ? (
              <div>
                <div>{`已选择${files.length}个文件`}</div>
                <ul>
                  {files.map((f, i) => (
                    <li key={i}>{f.filename}</li>
                  ))}
                </ul>
              </div>
            ) : (
              `请选择参与统计的文件`
            )}
          </SelectResult>
        ) : (
          <div style={{ padding: "20px 0" }}></div>
        )}

        {(loading && <Loading>・・・</Loading>) || (
          <Button $primary style={{ cursor: "pointer" }} disabled={files.length == 0} onClick={onSubmit}>
            开始汇总
          </Button>
        )}
        <Result>
          {resultFile && (
            <>
              <h2>汇总结果</h2>
              <hr></hr>

              <Link href={resultFile} target="_blank">
                <Icons.Excel />
                <LinkText>下载结果文件</LinkText>
              </Link>
            </>
          )}
          {resultText && <Text>{resultText}</Text>}
        </Result>
        {isComponentVisible && (
          <Modal ref={ref}>
            <SearchFile max={oldVersion ? 10 : 1} setVisible={setIsComponentVisible} onChange={selectFiles} />
          </Modal>
        )}
      </Content>
    </Container>
  );
}
