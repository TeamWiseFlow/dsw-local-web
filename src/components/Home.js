import styled from 'styled-components'

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

export default function Home() {

    return (
        <Container>
            <p>帮助/说明 TBD</p>
        </Container>
    )
}