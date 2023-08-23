import styled from 'styled-components'
import './App.css';
// import logo from './logo.svg';

import SearchFile from './components/SearchFile';

const Modal = styled.div`
  width: 500px;
`

const API = {
  FILE: 'http://localhost:3001/find'
}

function App() {
  return (
    <div className="App">

      <Modal>
        <SearchFile apiEndPoint={API.FILE} />
      </Modal>
    </div>
  );
}

export default App;
