import styled from 'styled-components'
import { debounce } from 'lodash'
import { useState, useEffect, useMemo } from 'react'

import Icons from './Icons'
import { API_URL_FILE, STYLE_CONFIG } from '../constants'

const Container = styled.div`
    display:flex;
    flex-direction: column;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    background-color: white;
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

const Bar = styled.div`
    display:flex;
    align-items:center;
    padding: ${STYLE_CONFIG.padding}px;
    gap: 10px;
`

const Divider = styled.div`
    width: 100%;
    background-color: #ddd;
    height: 1px;
`

const Input = styled.input`
    border:none;
    outline:none;
    line-height: 1rem;
    font-size: 1rem;
    flex: 1;
    &focus {
        outline:none;
    }
`

const Filters = styled.div`
    padding: ${STYLE_CONFIG.padding}px;
`

const Result = styled.div`

`

const ResultBar = styled.div`
    display: flex;
    gap: 10px;
    padding: ${STYLE_CONFIG.padding}px;
`

const ResultHint = styled.span`
    color: #aaa;
    font-size: 0.8rem;
    margin-right: auto;
    user-select: none;
`

const ResultAction = styled.button`

`

const ResultList = styled.div`
    display:flex;
    flex-direction: column;
    gap: 5px;
    padding: 0 ${STYLE_CONFIG.padding}px ${STYLE_CONFIG.padding}px ${STYLE_CONFIG.padding}px;
`

const FileLinkContainer = styled.div`
    display:flex;
    align-items:center;
    gap: 10px;
    border-radius: 5px;
    background-color: ${props => props.selected ? '#e3eaff' : 'transparent'};   
`

const FileName = styled.span`
    pointer-events: none;
    user-select: none;
`

const FileLink = (props) => {
    return (
        <FileLinkContainer selected={props.selected} onClick={props.onClick}>
            <FileIcon><Icons.Excel /></FileIcon>
            <FileName>{props.children}</FileName>
        </FileLinkContainer>
    )
}

/**
 * 调用API搜索文件名关键词筛选，支持多选，返回选中的文件列表
 * 
 * 目前假设都是精确匹配文件名中关键词，如服务器端glob实现：root/path/*keyword*.{xlsx,xls}
 * root目录目前服务器指定
 * 
 * keyword - 搜索关键词, 匹配文件名部分。*则列出所有文件。
 * filters - 过滤条件，目前支持文件名后缀，在UI中选择。示例：{ 'ext': ['.xlsx', '.xls'] }。（可扩充支持文件大小、文件修改时间等）。（也可扩充keyword支持，如*.xlsx）。
 * onChange - 选择文件变化时的回调函数，返回选中的文件列表。
 * 
 */
const SearchFile = ({ placeholder, keyword, filters, onChange }) => {

    filters = filters || {
        'ext': ['xlsx', 'xls'],
    }

    let [inputValue, setInputValue] = useState(keyword || '');
    let [files, setFiles] = useState([]);
    useEffect(() => {
        if (inputValue) {
            fetch(API_URL_FILE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keyword: inputValue,
                    filters
                })
            }).then(res => res.json()).then(data => {
                setFiles(data);
            })
        }
    }, [inputValue])

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
        if (event.target.value === '') {
            setFiles([]);
        }
    }

    const debouncedChangeHandler = useMemo(
        () => debounce(handleInputChange, 500)
        , [inputValue]);

    const handleFileClick = (file) => {
        const updatedFiles = files.map(f => {
            if (f.name === file.name) {
                return { ...f, selected: !f.selected };
            } else {
                return f;
            }
        });
        setFiles(updatedFiles);
    }

    const selectAll = () => {
        const updatedFiles = files.map(f => ({ ...f, selected: true }));
        setFiles(updatedFiles);
    }

    const selectNone = () => {
        const updatedFiles = files.map(f => ({ ...f, selected: false }));
        setFiles(updatedFiles);
    }

    useEffect(() => {
        onChange(files.filter(f => f.selected));
    }, [files])

    return (
        <Container>
            <Bar>
                <Icon><Icons.Find /></Icon>
                <Input placeholder={placeholder || '查找文件,输入*列出所有文件'} onChange={debouncedChangeHandler} />
            </Bar>
            <Divider />
            {/* <Filters /> */}
            <Result>
                {files.length > 0 &&
                    <ResultBar>
                        <ResultHint>点击多选文件</ResultHint>
                        <ResultAction onClick={selectAll}>全选</ResultAction>
                        <ResultAction onClick={selectNone}>取消选择</ResultAction>
                    </ResultBar>}
                {files.length > 0 &&
                    <ResultList>
                        {files.map(file => (
                            <FileLink
                                key={file.name}
                                selected={file.selected}
                                onClick={() => handleFileClick(file)}>{file.name}</FileLink>
                        ))}
                    </ResultList>}
            </Result>
        </Container>
    )
}

export default SearchFile;