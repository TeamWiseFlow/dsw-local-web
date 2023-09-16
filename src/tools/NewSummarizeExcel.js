import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Button } from "../components/Common";
import Icons from "../components/Icons";
import SearchFile from "../components/SearchFile";
import { useComponentVisible } from "../components/Common";
import { collection } from "../service/collection";
import { useStore } from "../useStore";

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

  background-color: #ffd7aa;
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
  display: flex;
  align-items: center;
  cursor: pointer;

  & svg {
    width: 30px;
    height: 30px;
    display: inline-block;
  }

  &:hover {
    text-decoration: underline;
  }
`;

const Modal = styled.div`
  position: absolute;
  width: 500px;
  height: auto;
`;

const loadingAnimation = keyframes`
  to {
    clip-path: inset(0 -1ch 0 0)
  }
`;

const Loading = styled.div`
  font-weight: bold;
  display: inline-block;
  font-family: monospace;
  font-size: 20px;
  clip-path: inset(0 6ch 0 0);
  animation: ${loadingAnimation} 1s steps(7) infinite;
`;

export default function SummarzieExcel() {
    const { setErrorMessage } = useStore();
    let [files, setFiles] = useState([]);
    let [resultFile, setResultFile] = useState("");
    let [loading, setLoading] = useState(false);

    const { ref, isComponentVisible, setIsComponentVisible } =
        useComponentVisible(false);

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

    const run = async () => {
        setLoading(true);
        const res = await collection(files);
        const { flag, result } = res;
        if (flag === 0) {
            setResultFile(`${process.env.REACT_APP_RESULT_URL}${result}`);
        } else if (flag === 1) {
            setErrorMessage("输入的文件路径不对");
        } else if (flag === 2) {
            setErrorMessage("计算错误");
        }
        setLoading(false);

        // TODO: call api
        // setTimeout(() => {
        //     setLoading(false)
        //     setResultFile("result.xlsx")
        // }, 2000);
    };

    return (
        <Container>
            <Header>
                <h1>新集采统计工具</h1>
            </Header>
            <Content>
                <Button style={{ cursor: 'pointer' }} onClick={openSearch}>
                    {files.length == 0 ? "选择文件" : "重新选择"}
                </Button>
                {files.length > 0 ? <SelectResult>
                    {files.length > 0
                        ? <div>
                            <div>{`已选择${files.length}个文件`}</div>
                            <ul>
                                {files.map(f => <li>{f.filename}</li>)}
                            </ul>
                        </div>
                        : `请选择参与统计的文件`}
                </SelectResult> : <div style={{ padding: '20px 0' }}></div>
                }

                {(loading && <Loading>・・・</Loading>) || (
                    <Button style={{ cursor: 'pointer' }} disabled={files.length == 0} onClick={run}>
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
                                下载结果文件
                            </Link>
                        </>
                    )}
                </Result>
                {isComponentVisible && (
                    <Modal ref={ref}>
                        <SearchFile
                            max={1}
                            setVisible={setIsComponentVisible}
                            onChange={selectFiles}
                        />
                    </Modal>
                )}
            </Content>
        </Container>
    );
}
