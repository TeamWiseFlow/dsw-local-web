import styled from 'styled-components'
import React, { useState } from 'react'
import { API_URL_LOGIN, ERROR_LOGIN_EMPTY } from '../constants'

const Container = styled.div`
    display: flex;
    width: 100vw;
    height: 100vh;
    justify-content: center;
    align-items: center;
`

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 300px;
    border: 1px solid #ddd;
    border-radius: 10px;
    /* box-shadow: 0 0 3px #ccc; */
    padding: 10px 20px 40px 20px;
    background-color: #f8fbff;
`

const Label = styled.label`
    & p {
        font-size: 14px;
        line-height: 24px;
        font-weight: 400;
    }

    & input {
        border: 1px solid #ddd;
        border-radius: 5px; 
        padding: 3px 5px;
    }

    & input:focus {
        border: 1px solid #adbaff;
        outline: none;
    }
`

const Error = styled.div`
    color: #ee4242;
    font-size: 14px;
`

const Button = styled.button`
    border-radius: 5px;
    background-color: #2a4aff;
    color: white;
    border: none;
    padding: 5px 15px;
`

async function loginUser(credentials) {
    return fetch(API_URL_LOGIN, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    })
        .then(data => data.json())
}

export default function Login({ setToken }) {
    const [username, setUserName] = useState()
    const [password, setPassword] = useState()
    const [error, setError] = useState()

    const handleSubmit = async e => {
        e.preventDefault()

        if (!username || !password) {
            setError(ERROR_LOGIN_EMPTY)
            return
        }

        const res = await loginUser({ username, password })
        if (res.error) {
            setError(res.error)
            return
        } else if (res.token) {
            setToken(res.token)
        }
    }

    return (
        <Container>
            <Form onSubmit={handleSubmit}>
                <h2>登录</h2>
                <Label>
                    <p>用户名</p>
                    <input type="text" onChange={e => setUserName(e.target.value)} />
                </Label>
                <Label>
                    <p>密码</p>
                    <input type="password" onChange={e => setPassword(e.target.value)} />
                </Label>
                <Error>{error}</Error>
                <div>
                    <Button type="submit">提交</Button>
                </div>
            </Form>
        </Container>
    )
}