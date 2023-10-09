import { useState, useEffect, useRef } from 'react';
import styled from "styled-components"

export const Button = styled.button`
    border-radius: 5px;
    background-color: var(--button-primary);
    color: white;
    border: none;
    padding: 5px 15px;

    &[disabled] {
        pointer-events: none;
        cursor: not-allowed;
        background-color: #ccc;
    }
`

export const SecondaryButton = styled(Button)`
    background-color: #eee;
    border: 1px solid #ccc;
    color: black;
    cursor: pointer
`

export function useComponentVisible(initialIsVisible) {
    const [isComponentVisible, setIsComponentVisible] = useState(initialIsVisible);
    const ref = useRef(null);

    const handleClickOutside = (event) => {
        if (ref.current && !ref.current.contains(event.target)) {
            setIsComponentVisible(false);
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, []);

    return { ref, isComponentVisible, setIsComponentVisible };
}