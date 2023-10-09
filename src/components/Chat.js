import styled from "styled-components";
import { createElement, useState, useEffect, useMemo, useRef } from "react";
import Icons from "./Icons";
import { useStore } from "../useStore";
import { API_PATH_FILE, FILE_EXT } from "../constants";
import { Button } from "./Common";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  gap: 20px;
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 20px;
`;

const Placeholder = styled.p`
  text-align: center;
  width: 100%;
  height: 200px;
  line-height: 200px;
  font-size: 2rem;
  color: var(--text-placeholder);
  user-select: none;
`;

const Send = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 10px 10px 20px;
  gap: 10px;
  width: 700px;
  align-self: center;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
`;

const SendIcon = styled.div`
  & svg {
    width: 30px;
    height: 30px;
  }

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: ${(props) => (props.disabled && "none") || "var(--button-primary)"};
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
  cursor: pointer;
`;

const Input = styled.input`
  border: none;
  outline: none;
  line-height: 1rem;
  font-size: 1rem;
  flex: 1;
  &focus {
    outline: none;
  }
`;
const Header = styled.div`
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-bottom: 1px solid #eee;
`;

const ChatContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  align-items: stretch;
`;

const Row = styled.div`
  padding: 20px;

  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;
const QuestionRow = styled(Row)`
  background-color: white;
`;
const AnswerRow = styled(Row)`
  background-color: #f8f8f8;
`;
const HeaderText = styled.div`
  text-align: center;
`;
const RowText = styled.div`
  width: 80ch;
  max-width: 90%;
`;
const IcoRow = styled.div`
  width: 30px;
  height: 30px;

  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const IcoQuestion = styled(IcoRow)`
  background-color: #ea3419;
`;

const IcoAnswer = styled(IcoRow)`
  background-color: #4489ea;
`;

const title = "财政GPT";

function Chat() {
  const [answer, setAnswer] = useState(null);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    setQuestion("这是一个测试问题");
    setAnswer({
      text: "这是一个测试回答",
    });
  }, []);

  const onSend = () => {
    if (!question) return;
  };

  return (
    <Container>
      <Content>
        {(answer && (
          <ChatContent>
            <Header>
              <HeaderText>{title}</HeaderText>
            </Header>
            <QuestionRow>
              <IcoQuestion>Q</IcoQuestion>
              <RowText>{question}</RowText>
            </QuestionRow>
            <AnswerRow>
              <IcoAnswer>A</IcoAnswer>
              <RowText>{answer.text}</RowText>
            </AnswerRow>
          </ChatContent>
        )) || <Placeholder>{title}</Placeholder>}
      </Content>
      <Footer>
        <Send>
          <Input placeholder={"描述您的问题"} onChange={(e) => setQuestion(e.target.value)} value={question} />
          <SendIcon disabled={!question} onClick={onSend}>
            <Icons.Send fill={(question && "white") || "#eee"} />
          </SendIcon>
        </Send>
      </Footer>
    </Container>
  );
}

export default Chat;
