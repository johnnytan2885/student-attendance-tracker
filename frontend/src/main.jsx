import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './App.css';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);