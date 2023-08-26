import styled from 'styled-components'
import { debounce } from 'lodash'
import { useState, useEffect, useMemo } from 'react'
import Icons from './Icons'
import { useStore } from '../useStore'
import { API_URL_BASE, API_URL_FILE, ERROR_HTTP } from '../constants'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;

    & p {
        color: #aaa;
    }
`

const FileLink = styled.a`

`

const Library = ({ }) => {
    const { getFiles } = useStore()
    const [files, setFiles] = useState([])

    useEffect(() => {
        (async () => {
            let res = await getFiles()
            if (res.error) {
                if (res.status >= 400) {
                    console.log(ERROR_HTTP[400])
                } else {
                    console.log(res)
                }
            } else {
                setFiles(res)
            }
        })();
    }, [])

    useEffect(() => {
    }, [files])

    return (
        <Container>
            <div>Library</div>
            {
                files.map(f => (
                    <FileLink key={f.id} href={API_URL_FILE + `${f.id}/${f.file}`} target="_blank">{f.filename}</FileLink>
                ))
            }
        </Container>
    )
}

export default Library
