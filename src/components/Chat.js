import styled from "styled-components";
import { useState, useEffect } from "react";
import Icons from "./Icons";
import { useStore } from "../useStore";

import Loading from "./Loading";
import { newlineToParagraphs } from "./Common";

import { useMidPlatform } from "../hooks/useMidPlatform";

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
  overflow-y: scroll;
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 20px;
  padding-top: 20px;
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
  &:focus {
    outline: none;
  }
  &:disabled {
    background-color: white;
    color: var(--text-disabled);
  }
`;
const Header = styled.div`
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-bottom: 1px solid #eee;
`;

const ChatContent = styled.div`
  width: 100%;
  height: auto;
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
  display: flex;
  align-items: flex-start;
  background-color: #f8f8f8;
`;
const HeaderText = styled.div`
  text-align: center;
`;
const RowText = styled.div`
  width: 80ch;
  max-width: 90%;

  p {
    line-height: 1.7rem;
  }
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

const EmptyContent = styled.div`
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const title = "财政GPT";

function Chat() {
  const [question, setQuestion] = useState("");
  const [displayQuestion, setDisplayQuestion] = useState("");

  const { setErrorMessage } = useStore();

  const { request, result, loading, error, setError } = useMidPlatform();

  useEffect(() => {}, []);
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  const onSubmit = async () => {
    if (!question) return;
    setDisplayQuestion("");
    await request("dm", { type: "text", content: question }, (json) => {
      if (json.flag == 1 || json.result.length == 0 || json.result.filter((r) => r.type === "text").length == 0) {
        if (json.flag != 1) return { type: "text", answer: "没有找到答案" };
        return json.result;
      }
      if (json.flag === 0 || json.flag === 2) {
        return [json.result.find((r) => r.type == "text")];
      }

      setError("接口返回" + ":" + json.flag);
      return [];
    });
    if (!error) {
      setDisplayQuestion(question);
      setQuestion("");
    }
  };

  const onInputKeyPress = (e) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  return (
    <Container>
      <Content>
        {(result && result.length > 0 && (
          <ChatContent>
            <Header>
              <HeaderText>{title}</HeaderText>
            </Header>
            <QuestionRow>
              <IcoQuestion>Q</IcoQuestion>
              <RowText>{displayQuestion}</RowText>
            </QuestionRow>
            <AnswerRow>
              <IcoAnswer>A</IcoAnswer>
              <RowText>{newlineToParagraphs(result[0].answer)}</RowText>
            </AnswerRow>
          </ChatContent>
        )) || (
          <EmptyContent>
            <Placeholder>{title}</Placeholder>
            {loading && <Loading>・・・</Loading>}
          </EmptyContent>
        )}
      </Content>
      <Footer>
        <Send>
          <Input disabled={loading} placeholder={"描述您的问题"} onKeyPress={onInputKeyPress} onChange={(e) => setQuestion(e.target.value)} value={question} />
          <SendIcon disabled={!question || loading} onClick={onSubmit}>
            <Icons.Send fill={(question && !loading && "white") || "#eee"} />
          </SendIcon>
        </Send>
      </Footer>
    </Container>
  );
}

export default Chat;
