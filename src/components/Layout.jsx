import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import PageTransition from './PageTransition';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 antialiased transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <CartDrawer />
      <Footer />
    </div>
  );
}
