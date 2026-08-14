import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export const Layout = ({ children }: { children: ReactNode }) => (
  <div className="app-shell flex min-h-screen flex-col bg-background">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);
