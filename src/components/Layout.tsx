import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ConnectKitButton } from "connectkit";

const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--gold))/20] bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-[hsl(var(--gold))]">
              KURI
            </Link>
            {/* Navigation */}
            <nav className="flex gap-6">
              <Link
                to="/markets"
                className={`text-foreground hover:text-[hsl(var(--gold))] transition-colors duration-300 ${
                  location.pathname.startsWith("/markets")
                    ? "text-[hsl(var(--gold))]"
                    : ""
                }`}
              >
                Markets
              </Link>
              <Link
                to="/dashboard"
                className={`text-foreground hover:text-[hsl(var(--gold))] transition-colors duration-300 ${
                  location.pathname === "/dashboard"
                    ? "text-[hsl(var(--gold))]"
                    : ""
                }`}
              >
                Dashboard
              </Link>
            </nav>
          </div>
          <ConnectKitButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-12rem)]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[hsl(var(--sand))/10 border-t border-[hsl(var(--gold))/20]">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-muted-foreground">
            © {new Date().getFullYear()} Kuri. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
