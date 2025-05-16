import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ConnectButton } from "./ui/ConnectButton";

import { getAccount } from "@wagmi/core";
import { config } from "../config/wagmi";
import { ProfileButton } from "./ui/ProfileButton";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const account = getAccount(config);

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
            <nav className="flex items-center gap-6">
              <Link
                to="/markets"
                className={`text-sm font-medium transition-colors hover:text-[hsl(var(--gold))] ${
                  location.pathname === "/markets"
                    ? "text-[hsl(var(--gold))]"
                    : "text-muted-foreground"
                }`}
              >
                Markets
              </Link>
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-[hsl(var(--gold))] ${
                  location.pathname === "/dashboard"
                    ? "text-[hsl(var(--gold))]"
                    : "text-muted-foreground"
                }`}
              >
                Dashboard
              </Link>
            </nav>
          </div>
          {/* Right side: Conditional rendering of Connect/Profile button */}
          {account.address ? <ProfileButton /> : <ConnectButton />}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>

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
