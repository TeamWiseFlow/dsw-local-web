import styled, { keyframes } from "styled-components";

const loadingAnimation = keyframes`
  to {
    clip-path: inset(0 -1ch 0 0)
  }
`;

const Loading = styled.div`
  font-weight: bold;
  display: inline-block;
  font-family: monospace;
  font-size: 20px;
  clip-path: inset(0 6ch 0 0);
  animation: ${loadingAnimation} 1s steps(7) infinite;
`;

export default Loading;
