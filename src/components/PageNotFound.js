import styled from "styled-components";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
`
const Message = styled.p`
    margin: 10px 0;
    & i {
        color: #aaa;
    }
`

export default function PageNotFound() {
    return (
        <Container>
            <h1>404</h1>
            <Message>您访问的页面不存在</Message>
        </Container>
    );
}