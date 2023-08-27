import styled from 'styled-components'
import { debounce, set } from 'lodash'
import { createElement, useState, useEffect, useMemo, useRef } from 'react'
import Icons from './Icons'
import { useStore } from '../useStore'
import { API_URL_FILE, FILE_EXT } from '../constants'
import { Button } from './Common'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;

    & p {
        color: #aaa;
    }
`
const Header = styled.div`
    padding: 20px 40px;
`

const Content = styled.div`
    padding: 20px 40px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
`

const FileListContainer = styled.div`
    margin-top: 30px;
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
`

const FileList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;

`

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
`

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
`

const FileName = styled.a`
    margin-right: auto;
    text-decoration: none;
    color: #111;
`

const FileAction = styled.div`
    font-size: 0.8rem;
    cursor: pointer;
    color: ${props => props.$warning && '#bc0d04' || '#666'};

    &:hover {
        text-decoration: underline;
    }
`

const UploadButton = ({ accept, onSelectFiles }) => {
    const ref = useRef(null)

    const onChange = (e) => {
        e.preventDefault()

        let files = e.target.files

        onSelectFiles(files)
    }

    const onClick = (e) => {
        e.target.value = null
    }

    return (
        <>
            <Button onClick={() => ref.current.click()}>上传文件</Button>
            <input
                type="file"
                accept={accept}
                ref={ref}
                hidden
                onChange={onChange}
                onClick={onClick} />
        </>
    )
}

const Library = ({ }) => {
    const { getFiles, uploadFile, deleteFile } = useStore()
    const [files, setFiles] = useState([])
    const [deleting, setDeleting] = useState('')

    useEffect(() => {
        (async () => {
            let res = await getFiles()
            if (res && !res.error) {
                setFiles(res)
            }
        })();
    }, [])

    // useEffect(() => {
    // }, [files])

    const onSelectFiles = async (selectedFiles) => {
        //        console.log(files)
        let res = await uploadFile(selectedFiles[0])
        if (res && !res.error) {
            setFiles([res, ...files])
        }
    }

    const onBeginDeleteFile = (id) => {
        setDeleting(id)
    }

    const onDeleteFile = async (id) => {
        let res = await deleteFile(id)
        if (!res) {
            setFiles(files.filter(f => f.id != id))
        }
    }

    return (
        <Container>
            <Header>
                <h1>财政图书馆</h1>
            </Header>
            <Content>
                <UploadButton accept={Object.keys(FILE_EXT).map(k => '.' + k).join(',')} onSelectFiles={onSelectFiles} />
                <FileListContainer>
                    <h3>已上传文件</h3>
                    <FileList>
                        {
                            files.map(f => (
                                <FileLink key={f.id}>
                                    <FileIcon>{createElement(Icons[FILE_EXT[f.file.split('.').pop()] || 'File'])}</FileIcon>
                                    <FileName href={API_URL_FILE + `${f.id}/${f.file}`} target="_blank">{f.filename}</FileName>
                                    {deleting != f.id && <FileAction onClick={() => onBeginDeleteFile(f.id)}>删除</FileAction>}

                                    {
                                        deleting == f.id &&
                                        <>
                                            <FileAction onClick={() => onDeleteFile(f.id)} $warning>确认</FileAction>
                                            <FileAction onClick={() => setDeleting('')}>取消</FileAction>
                                        </>
                                    }
                                </FileLink>
                            ))
                        }
                    </FileList>
                </FileListContainer>
            </Content>
        </Container>
    )
}

export default Library
