// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: { background: '#fff', color: '#111827', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' },
        success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
      }} />
    </BrowserRouter>
  </React.StrictMode>
);
