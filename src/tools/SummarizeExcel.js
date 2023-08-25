import { useState } from 'react'
import styled from 'styled-components'
import { Button } from '../components/Common'
import Icons from '../components/Icons'
import SearchFile from '../components/SearchFile'
import { useComponentVisible } from '../components/Common'

const Container = styled.div`
    overflow-y: scroll;
`
const Header = styled.div`
    padding: 20px 40px;
`

const Content = styled.div`
    padding: 20px 40px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`

const SelectResult = styled.div`
    margin: 20px 0;
    color: #393232;

    background-color: #ffd7aa;
    padding: 10px;
    border-radius: 5px;
`

const Result = styled.div`
    margin: 20px 0;
    width: 100%;

    & hr {
        margin-bottom: 1.2rem;
    }
`

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
`

const Modal = styled.div`
    position: absolute;
    width: 500px;
    height: auto;
`

export default function SummarzieExcel() {

    let [searchOpen, setSearchOpen] = useState(false)
    let [files, setFiles] = useState([])
    let [resultFile, setResultFile] = useState("")

    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);

    const openSearch = () => {
        setIsComponentVisible(true)
        setSearchOpen(true)
    }

    const selectFiles = (files) => {
        if (!files || files.length == 0) {
            setFiles([])
        } else {
            setFiles(files)
        }
    }

    const run = () => {
        // TODO: call api
        setResultFile("result.xlsx")
    }

    return (
        <Container>
            <Header>
                <h1>集采统计工具</h1>
            </Header>
            <Content>
                <Button onClick={openSearch}>{files.length == 0 ? '选择文件' : '重新选择'}</Button>
                <SelectResult>{files.length > 0 ? `已选择${files.length}个文件` : `请选择参与统计的文件`}</SelectResult>
                <Button disabled={files.length == 0} onClick={run}>开始汇总</Button>
                <Result>
                    {
                        resultFile && <>
                            <h2>汇总结果</h2>
                            <hr></hr>
                            <Link href={resultFile} target="_blank">
                                <Icons.Excel />下载结果文件
                            </Link>
                        </>
                    }
                </Result>
                {isComponentVisible &&
                    <Modal ref={ref}>
                        <SearchFile onChange={selectFiles} />
                    </Modal>
                }
            </Content>
        </Container>
    )
}