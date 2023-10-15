import styled from "styled-components";
import { useState, useEffect } from "react";
import Icons from "./Icons";
import { useStore } from "../useStore";
import { ERROR_API } from "../constants";

import Loading from "./Loading";

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
  const [answer, setAnswer] = useState(null);
  const [question, setQuestion] = useState("");
  const [displayQuestion, setDisplayQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const { setErrorMessage, dm } = useStore();

  useEffect(() => {}, []);

  const onSend = async () => {
    if (!question) return;
    setAnswer("");
    setDisplayQuestion("");
    setLoading(true);
    let res = await dm(question);
    // console.log("res", res);
    setLoading(false);
    setDisplayQuestion(question);
    if (res.flag < 0) {
      //错误
      setAnswer("");
      setErrorMessage(ERROR_API["error"] + ":" + res.flag);
    } else if (res.flag == 1 || res.result.length == 0 || res.result.filter((result) => result.type === "text").length == 0) {
      // 无结果
      let message = ERROR_API[1];
      if (res.result.length > 0) {
        message = res.result[0].answer;
      }
      setAnswer({
        text: message,
      });
    } else if (res.flag == 0) {
      // 显示结果清单里第一个text类型
      setAnswer({
        text: res.result.find((r) => r.type == "text").answer,
      });
    }
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
              <RowText>{displayQuestion}</RowText>
            </QuestionRow>
            <AnswerRow>
              <IcoAnswer>A</IcoAnswer>
              <RowText>
                {answer.text.split("\n").map((l) => (
                  <p>{l}</p>
                ))}
              </RowText>
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
          <Input disabled={loading} placeholder={"描述您的问题"} onChange={(e) => setQuestion(e.target.value)} value={question} />
          <SendIcon disabled={!question || loading} onClick={onSend}>
            <Icons.Send fill={(question && !loading && "white") || "#eee"} />
          </SendIcon>
        </Send>
      </Footer>
    </Container>
  );
}

export default Chat;