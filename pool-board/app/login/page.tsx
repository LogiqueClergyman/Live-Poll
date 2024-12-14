'use client';
import { useState } from "react";
import StartLogin from "./components/StartLogin";
import CompleteLogin from "./components/CompleteLogin";

export default function LoginPage() {
  const [authData, setAuthData] = useState<PublicKeyCredentialRequestOptionsJSON | null>(null);

  const handleStartLogin = (data: PublicKeyCredentialRequestOptionsJSON) => {
    setAuthData(data);
  };

  return (
    <div>
      <h1>WebAuthn Passkey Login</h1>
      {!authData ? (
        <StartLogin onStart={handleStartLogin} />
      ) : (
        <CompleteLogin authData={authData} />
      )}
    </div>
  );
}