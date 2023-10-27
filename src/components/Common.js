import { useState, useEffect, useRef } from "react";
import styled from "styled-components";

export const Button = styled.button`
  border-radius: 5px;
  background-color: ${(props) => (props.$primary ? "var(--button-primary)" : "var(--button-secondary)")};
  color: ${(props) => (props.$primary ? "white" : "var(--text)")};
  border: ${(props) => (props.$primary ? "none" : "1px solid #ccc")};
  padding: 5px 15px;

  &[disabled] {
    pointer-events: none;
    cursor: not-allowed;
    background-color: var(--button-disabled);
  }
`;

export const SecondaryButton = styled(Button)`
  background-color: #eee;
  border: 1px solid #ccc;
  color: black;
  cursor: pointer;
`;

export function useComponentVisible(initialIsVisible) {
  const [isComponentVisible, setIsComponentVisible] = useState(initialIsVisible);
  const ref = useRef(null);

  const handleClickOutside = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setIsComponentVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  return { ref, isComponentVisible, setIsComponentVisible };
}

export function newlineToParagraphs(str) {
  return (
    <>
      {str.split("\n").map((l, i) => (
        <p key={i}>{l}</p>
      ))}
    </>
  );
}
