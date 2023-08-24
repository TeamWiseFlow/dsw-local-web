import React, { useState } from 'react'
import styled from 'styled-components'
import './App.css';
// import logo from './logo.svg';

import SearchFile from './components/SearchFile'
import Login from './components/Login/Login'
import useToken from './components/useToken'

const Modal = styled.div`
  width: 500px;
`

function App() {
  const [token, setToken] = useToken()

  if (!token) {
    return <Login setToken={setToken} />
  }

  return (
    <div className="App">

      <Modal>
        <SearchFile />

        <a onClick={() => setToken("")}>登出</a>
      </Modal>
    </div>
  );
}

export default App
