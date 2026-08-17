import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './App.css';

function Root() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default Root;