import React from "react";
import styled, { keyframes } from "styled-components";
import "./App.css";

import { Outlet, NavLink, BrowserRouter, Routes, Route } from "react-router-dom";

import ErrorPage from "./components/ErrorPage";
import Login from "./components/Login";
import Tools from "./tools/Tools";
import BudgetAnalysis from "./tools/BudgetAnalysis";
import Home from "./components/Home";
import Library from "./components/Library";
import Chat from "./components/Chat";
import Icons from "./components/Icons";
import PageNotFound from "./components/PageNotFound";

import { pb, useStore } from "./useStore";

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
`;

const SideBar = styled.div`
  width: 200px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--background-mid);
  border-right: 1px solid #ccc;

  & nav {
    flex: 1;
    overflow-y: scroll;
    padding: 20px;

    & ul {
      list-style-type: none;
      margin: 0;
      padding: 0;

      & li a:hover {
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
`;

const SideBarHeader = styled.div`
  min-height: 50px;
  border-bottom: 1px solid #ccc;
  display: flex;
  align-items: center;
  padding: 10px 20px;
`;

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
`;

const Content = styled.div`
  min-height: 100%;
  flex: 1;
  overflow-y: scroll;
`;

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
`;

const LinkIcon = styled.span`
  & svg {
    width: 30px;
    height: 30px;
  }

  display: inline-flex;
  justify-content: center;
  align-items: center;
`;

const slidedown = keyframes`
  from {
    top: -100px;
  }

  to {
    top: 0;
  }
`;

const ErrorBar = styled.div`
  position: absolute;
  top: 0;
  left: 40%;
  min-width: 200px;
  max-width: 500px;
  margin-left: 0;
  margin-right: 0;
  background-color: #faeeed;
  color: #582522;
  padding: 10px 20px;
  animation: ${slidedown} 0.3s ease-in-out;
  border: 1px solid #f5c6c4;
  border-radius: 0 0 5px 5px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
`;

const MENU_ITEMS = [
  // {
  //   to: '/',
  //   title: '首页',
  //   icon: Icons.Home
  // },
  {
    to: "/library",
    title: "财政图书馆",
    icon: Icons.Library,
  },
  {
    to: "/tools",
    title: "财政助手",
    icon: Icons.Apps,
  },

  {
    to: "/gpt",
    title: "财政GPT",
    icon: Icons.Chat,
  },
];

function Layout() {
  const { logout, errorMessage } = useStore();
  window.document.title = "绍兴财政局智慧系统";

  if (!pb.authStore.isValid) {
    return <Login />;
  }
  return (
    <Container>
      <SideBar>
        <SideBarHeader>欢迎回来，{pb?.authStore?.model?.email || ""}</SideBarHeader>
        <nav>
          <ul>
            {MENU_ITEMS.map((m) => (
              <li key={m.title}>
                <IconNavLink to={m.to} disabled={m.disabled}>
                  <LinkIcon disabled={m.disabled}>
                    <m.icon></m.icon>
                  </LinkIcon>
                  <span>{m.title}</span>
                </IconNavLink>
              </li>
            ))}
          </ul>
        </nav>
        <SideBarFooter>
          <a onClick={logout}>登出</a>
        </SideBarFooter>
      </SideBar>
      <Content>
        <Outlet />
        {errorMessage && <ErrorBar>{errorMessage}</ErrorBar>}
      </Content>
    </Container>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />} errorElement={<ErrorPage />}>
          <Route index element={<Home />} />
          <Route path="tools" element={<Tools />} />
          <Route path="tools/ba" element={<BudgetAnalysis />} />
          <Route path="library" element={<Library />} />
          <Route path="gpt" element={<Chat />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
