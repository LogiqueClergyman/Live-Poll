// app/layout.tsx
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>
        <h1>WebAuthn Login</h1>
      </header>
      <main>{children}</main>
    </div>
  );
}
