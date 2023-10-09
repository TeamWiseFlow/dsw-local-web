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
  padding: 20px 40px;
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
function Chat() {
  const [result, setResult] = useState(null);

  const [question, setQuestion] = useState("");

  const onSend = () => {
    if (!question) return;
  };

  return (
    <Container>
      <Content>{(result && <div>result</div>) || <Placeholder>财政GPT</Placeholder>}</Content>
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
