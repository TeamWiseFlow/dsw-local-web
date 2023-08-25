import React, { useState } from 'react'
import styled from 'styled-components'
import './App.css'
// import logo from './logo.svg';

import { Outlet, NavLink, Link, BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import ErrorPage from './ErrorPage'
import SearchFile from './components/SearchFile'
import Login from './components/Login'
import Tools from './tools/Tools'
import SummarizeExcel from './tools/SummarizeExcel'
import Home from './components/Home'
import useToken from './components/useToken'
import Icons from './components/Icons'

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

const IconNavLink = styled(NavLink)`
  display: flex;
  gap: 8px;
  align-items: center;
  text-decoration: none;
  padding: 10px;
  color: #666;

  & span svg path {
      fill: #666;
    }

  &.active span svg path {
      fill: #111;
    }

  & span[disabled] svg path {
      fill: #ccc;
    }
 
`

const LinkIcon = styled.span`
    & svg {
        width: 30px;
        height: 30px;
    }

    display: inline-flex;
    justify-content: center;
    align-items: center;
`

const MENU_ITEMS = [
  {
    to: '/',
    title: '首页',
    icon: Icons.Home
  },
  {
    to: '/tools',
    title: '财政助手',
    icon: Icons.Apps
  },
  {
    to: '/library',
    title: '财政图书馆',
    icon: Icons.Library,
    disabled: true
  },
  {
    to: '/gpt',
    title: '财政GPT',
    icon: Icons.Chat,
    disabled: true
  },
]

function Layout() {
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
            {
              MENU_ITEMS.map(m => (
                <li key={m.title}>
                  <IconNavLink to={m.to} disabled={m.disabled}>
                    <LinkIcon disabled={m.disabled}><m.icon></m.icon></LinkIcon>
                    <span>{m.title}</span>
                  </IconNavLink>
                </li>
              ))
            }
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
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />} errorElement={<ErrorPage />}>
          <Route index element={<Home />} />
          <Route path="tools" element={<Tools />} />
          <Route path="tools/sum" element={<SummarizeExcel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
