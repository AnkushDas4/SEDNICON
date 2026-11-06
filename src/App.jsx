import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';

import Home from './pages/Home';
import Library from './pages/Library';
import Generate from './pages/Generate';
import Docs from './pages/Docs';
import Status from './pages/Status';

export default function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/library" element={<Library />} />
                <Route path="/generate" element={<Generate />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/status" element={<Status />} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
