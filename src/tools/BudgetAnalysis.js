import { useState, useEffect } from "react";
import styled from "styled-components";
import { Button } from "../components/Common";
import Icons from "../components/Icons";
import SearchFile from "../components/SearchFile";
import { useComponentVisible } from "../components/Common";
import { useStore } from "../useStore";
import Loading from "../components/Loading";

import { useMidPlatform } from "../hooks/useMidPlatform";

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

export default function BudgetAnalysis({ oldVersion = false }) {
  const { setErrorMessage } = useStore();
  let [files, setFiles] = useState([]);
  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);
  const { request, result, loading, error, setError } = useMidPlatform();

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

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
    if (!files || files.length == 0) return;

    const paths = files.map((i) => `${process.env.REACT_APP_CMS_FILE_DIR}/${i.collectionId}/${i.id}/${i.file}`);
    await request(oldVersion ? "2022_budget_analysis" : "new_budget_analysis", oldVersion ? { files: paths } : { type: "file", content: paths[0] }, (json) => {
      if (json.flag === 21 && json.result.length == 2 && json.result[1].type == "file") {
        return json.result;
      }

      setError("接口返回错误" + ":" + json.flag);
      return [];
    });
  };

  return (
    <Container>
      <Header>
        <h1>{oldVersion ? "" : "新"}集采统计工具</h1>
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
          {result && result[1] && (
            <>
              <h2>汇总结果</h2>
              <hr></hr>

              <Link href={`${process.env.REACT_APP_RESULT_URL}${result[1].answer}`} target="_blank">
                <Icons.Excel />
                <LinkText>下载结果文件</LinkText>
              </Link>
            </>
          )}
          {result && result[0] && <Text>{result[0].answer}</Text>}
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
