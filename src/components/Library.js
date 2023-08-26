import styled from 'styled-components'
import { debounce } from 'lodash'
import { createElement, useState, useEffect, useMemo } from 'react'
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

const FileLink = styled.a`
    display: flex;
    gap: 10px;
    align-items: center;
    text-decoration: none;
    color: #111;
    border-radius: 5px;
    border: 1px solid #eee;
    padding: 10px 20px;
    width: 100%;
    background-color: #fff;

    &:hover {
        background-color: #fafafa;
    }
`
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
`

const FileIcon = styled.div`
    & path {
      
    }

    & svg {
        width: 30px;
        height: 30px;
    }

    display: flex;
    justify-content: center;
    align-items: center;
`

const Library = ({ }) => {
    const { getFiles } = useStore()
    const [files, setFiles] = useState([])

    useEffect(() => {
        (async () => {
            let res = await getFiles()
            if (!res.error) {
                setFiles(res)
            }
        })();
    }, [])

    useEffect(() => {
    }, [files])

    return (
        <Container>
            <Header>
                <h1>财政图书馆</h1>
            </Header>
            <Content>
                <Button>上传文件</Button>
                <FileListContainer>
                    <h3>已上传文件</h3>
                    <FileList>
                        {
                            files.map(f => (
                                <FileLink
                                    key={f.id}
                                    href={API_URL_FILE + `${f.id}/${f.file}`}
                                    target="_blank">
                                    <FileIcon>{createElement(Icons[FILE_EXT[f.file.split('.').pop()] || 'File'])}</FileIcon>
                                    {f.filename}
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
