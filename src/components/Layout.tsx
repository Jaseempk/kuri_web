import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ConnectButton } from "./ui/ConnectButton";
import { Logo } from "./ui/Logo";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useOptimizedAuth } from "../hooks/useOptimizedAuth";
import { ProfileButton } from "./ui/ProfileButton";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { smartAddress: address } = useOptimizedAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { path: "/markets", label: "Markets" },
    // { path: "/dashboard", label: "Dashboard" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--gold))/20] bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-3 xs:px-4 flex items-center justify-between h-24">
          {/* Left side: Logo and Desktop Navigation */}
          <div className="flex items-center gap-8 xs:gap-12">
            {/* Logo */}
            <Logo onClick={closeMobileMenu} showText={true} variant="layout" />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              {navigationItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`text-sm lg:text-base font-medium transition-colors hover:text-[hsl(var(--gold))] relative group ${
                    location.pathname === path ||
                    location.pathname.startsWith(path)
                      ? "text-[hsl(var(--gold))]"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[hsl(var(--gold))] transition-all duration-300 group-hover:w-full" />
                  {(location.pathname === path ||
                    location.pathname.startsWith(path)) && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[hsl(var(--gold))]" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side: Connect/Profile Button and Mobile Menu */}
          <div className="flex items-center gap-2 xs:gap-3">
            {/* Connect/Profile Button */}
            <div className="hidden xs:block">
              {address ? <ProfileButton /> : <ConnectButton />}
            </div>

            {/* Mobile Connect/Profile Button (smaller) */}
            <div className="xs:hidden">
              {address ? <ProfileButton /> : <ConnectButton />}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[hsl(var(--gold))/10] transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-[hsl(var(--gold))]" />
              ) : (
                <Menu className="h-5 w-5 text-[hsl(var(--gold))]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-[hsl(var(--gold))/20] mt-3 xs:mt-4 pt-3 xs:pt-4"
            >
              <nav className="flex flex-col space-y-3">
                {navigationItems.map(({ path, label }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={closeMobileMenu}
                    className={`text-base font-medium transition-colors hover:text-[hsl(var(--gold))] py-2 px-1 rounded-lg hover:bg-[hsl(var(--gold))/5] ${
                      location.pathname === path ||
                      location.pathname.startsWith(path)
                        ? "text-[hsl(var(--gold))] bg-[hsl(var(--gold))/10]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-3 xs:px-4 py-4 xs:py-6 sm:py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[hsl(var(--sand))/10] border-t border-[hsl(var(--gold))/20]">
        <div className="container mx-auto px-3 xs:px-4 py-4 xs:py-6">
          <div className="text-center text-xs xs:text-sm text-muted-foreground">
            © {new Date().getFullYear()} Kuri. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
