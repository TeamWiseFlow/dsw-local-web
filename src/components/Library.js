import styled from "styled-components";
import { createElement, useState, useEffect, useMemo, useRef } from "react";
import Icons from "./Icons";
import { useStore } from "../useStore";
import { API_PATH_FILE, FILE_EXT } from "../constants";
import { Button } from "./Common";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  & p {
    color: #aaa;
  }
`;
const Header = styled.div`
  padding: 20px 40px;
`;

const Content = styled.div`
  padding: 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  gap: 20px;
`;

const FileListContainer = styled.div`
  margin-bottom: 50px;
  width: 100%;
  height: 100%;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 5px;
  overflow-y: auto;
  min-height: auto;

  & h3 {
    font-size: 1rem;
    margin-bottom: 20px;
  }
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 10px 0;
`;

const FileLink = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  border-radius: 5px;
  border: 1px solid #eee;
  padding: 15px 20px;
  width: 100%;
  background-color: #fff;

  &:hover {
    background-color: #fafafa;
  }
`;

const FileIcon = styled.div`
  & path {
  }
  & svg {
    width: 24px;
    height: 24px;
  }

  display: flex;
  justify-content: center;
  align-items: center;
`;

const FileName = styled.a`
  margin-right: auto;
  text-decoration: none;
  color: #111;
`;
const FileTime = styled.span`
  font-size: 0.8rem;
  color: #666;
`;
const FileIndex = styled.span`
  font-size: 0.8rem;
  color: ${(props) => (props.$indexed && "var(--text-ok)") || "var(--text-muted)"};
`;
const FileAction = styled.div`
  font-size: 0.8rem;
  cursor: pointer;
  color: ${(props) => (props.$warning && "var(--text-warn)") || "var(--text-muted)"};

  &:hover {
    text-decoration: underline;
  }
`;

const Bar = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 10px;
`;

const Icon = styled.div`
  & path {
    fill: #eee;
  }

  & svg {
    width: 30px;
    height: 30px;
  }

  display: flex;
  justify-content: center;
  align-items: center;
`;

const Input = styled.input`
  border: none;
  outline: none;
  line-height: 1rem;
  font-size: 1rem;
  flex: 1;
  &focus {
    outline: none;
  }
`;

const Search = styled.div`
  border: 1px solid #eee;
  border-radius: 5px;
  max-width: 100%;
  //   width: 500px;
  align-self: stretch;
`;

const Toolbar = styled.div`
  align-self: stretch;
  display: flex;
  padding: 10px 10px;
  justify-content: flex-end;
`;

const UploadButton = ({ accept, onSelectFiles }) => {
  const ref = useRef(null);

  const onChange = (e) => {
    e.preventDefault();

    let files = e.target.files;

    onSelectFiles(files);
  };

  const onClick = (e) => {
    e.target.value = null;
  };

  return (
    <>
      <Button style={{ cursor: "pointer" }} onClick={() => ref.current.click()}>
        上传文件
      </Button>
      <input type="file" accept={accept} ref={ref} hidden onChange={onChange} onClick={onClick} />
    </>
  );
};

const Library = ({}) => {
  const { getFiles, uploadFile, deleteFile } = useStore();
  const [files, setFiles] = useState([]);
  const [deleting, setDeleting] = useState("");

  const [keywords, setKeywords] = useState("");

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    console.log("fetching files");
    let res = await getFiles();
    if (res && !res.error) {
      setFiles(res);
    }
  };

  const onSelectFiles = async (selectedFiles) => {
    //        console.log(files)
    let res = await uploadFile(selectedFiles[0]);
    if (res && !res.error) {
      // console.log('uploaded file', res)
      // setFiles([res, ...files]);
      fetchFiles(); // 再次刷新文件清单，因为CMS新增文件后，pb hook向中台添加并更新是否索引字段
    }
  };

  const onBeginDeleteFile = (id) => {
    setDeleting(id);
  };

  const onDeleteFile = async (id) => {
    let res = await deleteFile(id);
    if (!res) {
      //setFiles(files.filter((f) => f.id != id));
    }
    // pb hook向中台删除文件后，再次刷新文件清单，因为可能中台删除失败，pb删除被终止
    fetchFiles();
    setDeleting("");
  };

  return (
    <Container>
      <Header>
        <h1>财政图书馆</h1>
      </Header>
      <Content>
        <Search>
          <Bar>
            <Icon>
              <Icons.Find />
            </Icon>
            <Input placeholder={"关键词"} onChange={(e) => setKeywords(e.target.value)} value={keywords} />
            <Button disabled={!keywords}>搜索</Button>
          </Bar>
        </Search>

        <Toolbar>
          <UploadButton
            accept={Object.keys(FILE_EXT)
              .map((k) => "." + k)
              .join(",")}
            onSelectFiles={onSelectFiles}
          />
        </Toolbar>

        <FileListContainer>
          <FileList>
            {files.map((f) => (
              <FileLink key={f.id}>
                <FileIcon>{createElement(Icons?.[FILE_EXT?.[f.file.split(".").pop()] || "File"] || Icons["File"])}</FileIcon>
                <FileName href={process.env.REACT_APP_API_URL_BASE + API_PATH_FILE + `${f.id}/${f.file}`} target="_blank">
                  {f.filename}
                </FileName>
                <FileIndex $indexed={f.indexed}>{f.indexed ? "已索引" : "未索引"}</FileIndex>
                <FileTime>{new Date(f.created).toLocaleString()}</FileTime>|{deleting != f.id && <FileAction onClick={() => onBeginDeleteFile(f.id)}>删除</FileAction>}
                {deleting == f.id && (
                  <>
                    <FileAction onClick={() => onDeleteFile(f.id)} $warning>
                      确认
                    </FileAction>
                    <FileAction onClick={() => setDeleting("")}>取消</FileAction>
                  </>
                )}
              </FileLink>
            ))}
          </FileList>
        </FileListContainer>
      </Content>
    </Container>
  );
};

export default Library;
