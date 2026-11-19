import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-neutral-950/40 z-30 lg:hidden backdrop-blur-[2px] transition-opacity"
          aria-hidden
        />
      )}

      {/* Sidebar drawer — width matches Sidebar (260px) */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[260px] transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 lg:pb-6 scrollbar-thin scrollbar-thumb-neutral-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
