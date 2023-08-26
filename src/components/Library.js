import styled from 'styled-components'
import { debounce } from 'lodash'
import { useState, useEffect, useMemo } from 'react'
import Icons from './Icons'
import { useStore } from '../useStore'

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

const Library = ({ }) => {

    return (
        <Container>
            <div>Library</div>
        </Container>
    )
}

export default Library
