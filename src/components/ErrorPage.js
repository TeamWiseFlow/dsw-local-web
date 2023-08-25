import { useRouteError } from "react-router-dom";
import styled from "styled-components";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: calc(100vh - 50px);
`
const Message = styled.p`
    margin: 10px 0;
    & i {
        color: #aaa;
    }
`

export default function ErrorPage() {
    const error = useRouteError();
    console.error(error);

    return (
        <Container>
            <h1>错误</h1>
            <Message>抱歉，出现了一些问题</Message>
            <Message>
                <i>{error.statusText || error.message}</i>
            </Message>
        </Container>
    );
}