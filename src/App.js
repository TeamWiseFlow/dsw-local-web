import React, { useState } from 'react'
import styled from 'styled-components'
import './App.css';
// import logo from './logo.svg';

import { Outlet, NavLink } from 'react-router-dom';

import SearchFile from './components/SearchFile'
import Login from './components/Login/Login'
import useToken from './components/useToken'

const Modal = styled.div`
  width: 500px;
`

const Container = styled.div`
  width:100%;
  height:100%;
  display: flex;

`

const SideBar = styled.div`
  width: 200px;
  height:100%;
  display:  flex;
  flex-direction: column;
  background-color: #f7f7f7;
  border-right: 1px solid #ccc;

  & nav {
    flex:  1;
    overflow-y: scroll;
    padding: 20px;

    & ul {
      list-style-type: none;
      margin: 0;
      padding: 0;

      & li a {
        display: block;
        text-decoration: none;
        padding: 10px;
        color: #666;
      }

      & li a:hover  {
        background-color: #ebeef7;
        border-radius: 10px;
      }

      & li a.active {
        background-color: transparent;
        font-weight: bold;
        color: #111;
      }

      & li a[disabled] {
        color: #ccc;
        pointer-events: none;
      }

      & li a[disabled]:hover {
        background-color: transparent;
        color: #ccc;
        cursor: not-allowed;
      }
    }
  }
`

const SideBarHeader = styled.div`
  height: 50px;
  border-bottom: 1px solid #ccc;
  display: flex;
  align-items: center;
  padding: 0 20px;
`

const SideBarFooter = styled.div`
  height: 50px;
  border-top: 1px solid #ccc;
  display: flex;
  align-items: center;
  padding: 0 20px;

  & a {
    cursor: pointer;
  }

  & a:hover {
    text-decoration: underline;
  }
`

const Content = styled.div`
  min-height: 100%;
  flex: 1;
  overflow-y: scroll;
`


function App() {
  const [token, setToken] = useToken()

  if (!token) {
    return <Login setToken={setToken} />
  }

  return (
    <Container>
      <SideBar>
        <SideBarHeader>欢迎回来，user</SideBarHeader>
        <nav>
          <ul>
            <li><NavLink to={`/`} >首页</NavLink></li>
            <li><NavLink to={`/tools`} >财政助手</NavLink></li>
            <li><NavLink to={`/library`} disabled >财政图书馆</NavLink></li>
            <li><NavLink to={`/gpt`} disabled >财政GPT</NavLink></li>
          </ul>
        </nav>
        <SideBarFooter>
          <a onClick={() => setToken("")}>登出</a>
        </SideBarFooter>
      </SideBar>
      <Content>
        <Outlet />
      </Content>
    </Container >




    // <Modal>
    //   <SearchFile />

    //   <a onClick={() => setToken("")}>登出</a>
    // </Modal>

  );
}

export default App
