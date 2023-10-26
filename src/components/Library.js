import styled from "styled-components";
import { createElement, useState, useEffect, useRef } from "react";
import Icons from "./Icons";
import { useStore } from "../useStore";
import { FILE_EXT } from "../constants";
import { Button } from "./Common";
import Loading from "../components/Loading";

import { useMidPlatform } from "../hooks/useMidPlatform";

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
  flex-shrink: 0;
`;

const FileName = styled.a`
  margin-right: auto;
  text-decoration: none;
  color: #111;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;
const FileTime = styled.span`
  font-size: 0.8rem;
  color: #666;
  white-space: nowrap;
`;
const FileIndex = styled.span`
  white-space: nowrap;
  font-size: 0.8rem;
  color: ${(props) => (props.$indexed && "var(--text-ok)") || "var(--text-muted)"};
`;
const FileAction = styled.div`
  white-space: nowrap;
  font-size: 0.8rem;
  cursor: pointer;
  color: ${(props) => (props.$warning && "var(--text-warn)") || "var(--text-muted)"};

  &:hover {
    text-decoration: underline;
  }
`;

const Divider = styled.div`
  width: 1px;
  align-self: stretch;
  background-color: #eee;
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
    min-width: 30px;
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
  &:focus {
    outline: none;
  }
  &:disabled {
    background-color: white;
    color: var(--text-disabled);
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
  gap: 20px;
  padding: 10px 10px;
  justify-content: flex-end;
  align-items: center;
`;

const SortButton = styled.div`
  font-size: 0.8rem;
  cursor: pointer;
  color: var(--text-muted);
  user-select: none;
`;

const Hint = styled.p``;
const ListExt = styled.ul`
  list-style: none;
`;
const ListItemExt = styled.li`
  display: inline-block;
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 12px;
  border-radius: 20px;
  background-color: white;
  color: #666;
  font-weight: bold;
  padding: 8px 10px;
  margin-right: 10px;
  user-select: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &[disabled] {
    color: #ccc;
  }

  &:last-child {
    margin-right: 0;
  }
`;

const Count = styled.div`
  margin-top: 1rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  align-self: stretch;
  text-align: center;
`;

const UploadButton = ({ disabled, accept, onSelectFiles }) => {
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
      <Button disabled={disabled} $primary style={{ cursor: "pointer" }} onClick={() => ref.current.click()}>
        上传文件
      </Button>
      <input type="file" accept={accept} ref={ref} hidden onChange={onChange} onClick={onClick} />
    </>
  );
};

const Library = ({}) => {
  const [files, setFiles] = useState([]);
  const [exts, setExts] = useState({}); // {pdf:true, doc:false}
  const [deleting, setDeleting] = useState("");
  const [keywords, setKeywords] = useState("");
  const [orderBy, setOrderBy] = useState("date-asc"); // date-asc, date-desc, name-asc, name-desc
  const [countSearch, setCountSearch] = useState(-1); // 搜索结果数量, -1为显示所有，0为搜索没有结果

  const { getFiles, uploadFile, deleteFile, setErrorMessage } = useStore();
  const { request, result, setResult, loading, setLoading, error, setError } = useMidPlatform();

  useEffect(() => {
    fetchFiles();
    toggleSort();
  }, []);

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  useEffect(() => {
    if (!keywords) {
      // console.log("keywords", keywords);
      _allFilesNotInSearch(files);
    }
  }, [keywords]);

  useEffect(() => {
    console.log("countSearch", countSearch);
  }, [countSearch]);

  useEffect(() => {
    if (result == null) return;
    if (Array.isArray(result) && result.length == 0) {
      setCountSearch(_filterFilesByName([]));
    } else {
      setCountSearch(_filterFilesByName(result.map((r) => r.answer)));
    }
  }, [result]);

  useEffect(() => {}, [files]);

  const _resetExts = (files) => {
    let exts = {};
    for (var i = 0; i < files.length; i++) {
      if (keywords && files[i].notInSearch) continue;
      exts[files[i].file.split(".").pop()] = true;
    }
    setExts(exts);
  };

  const _filterFilesByExt = (files) => {
    if (Object.keys(exts).length > 0) {
      for (var i = 0; i < files.length; i++) {
        files[i].hidden = false;
      }
      for (var i = 0; i < files.length; i++) {
        files[i].hidden = !exts[files[i].file.split(".").pop()];
      }
      setFiles(files);
    }
  };

  const _allFilesNotInSearch = (files) => {
    for (var i = 0; i < files.length; i++) {
      files[i].notInSearch = true;
      files[i].hidden = false;
    }
    setResult(null);
    setCountSearch(-1);
    setFiles(files);
    _resetExts(files);
  };

  const _filterFilesByName = (fileNames) => {
    let count = 0;
    if (!fileNames || fileNames.length == 0) {
      for (var i = 0; i < files.length; i++) {
        files[i].notInSearch = true;
      }
    } else {
      for (var i = 0; i < files.length; i++) {
        files[i].notInSearch = true;
      }

      for (var i = 0; i < files.length; i++) {
        if (fileNames.some((name) => name === files[i].filename || name === files[i].file)) {
          files[i].notInSearch = false;
          count++;
        }
      }
    }
    setFiles(files);
    _resetExts(files);
    return count;
  };

  const fetchFiles = async () => {
    console.log("fetching files");
    let res = await getFiles();
    if (res && !res.error) {
      // console.log(res);
      setFiles(res);
      _resetExts(res);
    }
  };

  const onSubmit = async () => {
    if (!keywords) return;

    await request("dm", { type: "text", content: keywords }, (json) => {
      if (json.flag == 1 || json.result.length == 0 || json.result.filter((r) => r.type === "file").length == 0) {
        return [];
      }
      if (json.flag === 0 || json.flag === 2) {
        return json.result.filter((r) => r.type === "file");
      }

      setError("接口返回" + ":" + json.flag);
      return [];
    });
  };

  const onSelectFiles = async (selectedFiles) => {
    setLoading(true);
    let res = await uploadFile(selectedFiles[0]);
    if (res && !res.error) {
      fetchFiles(); // 再次刷新文件清单，因为CMS新增文件后，pb hook向中台添加并更新是否索引字段
    }
    setLoading(false);
  };

  const onBeginDeleteFile = (id) => {
    setDeleting(id);
  };

  const onDeleteFile = async (id) => {
    setLoading(true);
    let res = await deleteFile(id);
    if (!res) {
      //setFiles(files.filter((f) => f.id != id));
    }
    // pb hook向中台删除文件后，再次刷新文件清单，因为可能中台删除失败，pb删除被终止
    fetchFiles();
    setDeleting("");
    setLoading(false);
  };

  const onInputKeyPress = (e) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  const toggleSort = () => {
    setOrderBy(orderBy == "date-desc" ? "date-asc" : "date-desc");
    files.sort((a, b) => (new Date(a.created) - new Date(b.created)) * (orderBy == "date-desc" ? 1 : -1));

    setFiles(files);
  };

  const toggleExt = (ext) => {
    exts[ext] = !exts[ext];
    setExts({ ...exts });
    _filterFilesByExt(files);
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
            <Input disabled={loading} placeholder={"关键词"} onKeyPress={onInputKeyPress} onChange={(e) => setKeywords(e.target.value)} value={keywords} />
            <Button $primary disabled={!keywords || loading} onClick={onSubmit}>
              搜索
            </Button>
          </Bar>
        </Search>

        <Toolbar>
          {keywords && countSearch >= 0 && !loading && <Button onClick={() => setKeywords("")}>显示全部文件</Button>}

          <UploadButton
            disabled={loading || (keywords && countSearch > 0)}
            accept={Object.keys(FILE_EXT)
              .map((k) => "." + k)
              .join(",")}
            onSelectFiles={onSelectFiles}
          />
        </Toolbar>
        {!loading && (
          <Toolbar>
            <ListExt>
              {Object.keys(exts).map((ext) => (
                <ListItemExt key={ext} disabled={!exts[ext]} onClick={toggleExt.bind(this, ext)}>
                  {ext}
                </ListItemExt>
              ))}
            </ListExt>
            <Divider></Divider>
            <SortButton onClick={toggleSort}>{orderBy == "date-asc" ? "日期↑" : "日期↓"}</SortButton>
          </Toolbar>
        )}
        {loading && <Loading>・・・</Loading>}
        <FileListContainer>
          <FileList>
            {keywords && countSearch == 0 && <Hint>没有查询到相关文件</Hint>}
            {!loading &&
              files
                .filter((f) => (keywords && countSearch > 0 && !f.hidden && !f.notInSearch) || (keywords && countSearch < 0) || (!keywords && !f.hidden))
                .map((f) => (
                  <FileLink key={f.id}>
                    <FileIcon>{createElement(Icons?.[FILE_EXT?.[f.file.split(".").pop()] || "File"] || Icons["File"])}</FileIcon>
                    <FileName href={process.env.REACT_APP_API_URL_BASE + `/api/files/documents/${f.id}/${f.file}`} target="_blank">
                      {f.filename}
                    </FileName>
                    <FileIndex $indexed={f.indexed}>{f.indexed ? "已索引" : "未索引"}</FileIndex>
                    <FileTime>{new Date(f.created).toLocaleString()}</FileTime>
                    <Divider></Divider>
                    {deleting != f.id && <FileAction onClick={() => onBeginDeleteFile(f.id)}>删除</FileAction>}
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
            {!loading && countSearch > 0 && <Count>共{countSearch}个文件</Count>}
            {!loading && countSearch < 0 && <Count>共{files.length}个文件</Count>}
          </FileList>
        </FileListContainer>
      </Content>
    </Container>
  );
};

export default Library;
