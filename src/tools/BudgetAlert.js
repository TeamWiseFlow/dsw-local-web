import styled from "styled-components";

const Container = styled.div`
  overflow-y: scroll;
`;

const Header = styled.div`
  padding: 20px 40px;
`;

const Content = styled.div`
  padding: 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
`;

export default function BudgetAlert({}) {
  return (
    <Container>
      <Header>
        <h1>预算预警</h1>
      </Header>
      <Content>
        <Video controls autoPlay src="http://47.98.147.178:8090/media/2555.MP4"></Video>
      </Content>
    </Container>
  );
}
