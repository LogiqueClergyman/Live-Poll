'use client';
import { useState } from "react";
import StartRegistration from "./components/StartRegistration";
import CompleteRegistration from "./components/CompleteRegistration";

export default function RegistrationPage() {
  const [challengeData, setChallengeData] = useState<PublicKeyCredentialCreationOptions | null>(null);

  const handleStartRegistration = (data: PublicKeyCredentialCreationOptionsJSON) => {
    setChallengeData(data);
  };

  return (
    <div>
      <h1>WebAuthn Passkey Registration</h1>
      {!challengeData ? (
        <StartRegistration onStart={handleStartRegistration} />
      ) : (
        <CompleteRegistration challengeData={challengeData} />
      )}
    </div>
  );
}