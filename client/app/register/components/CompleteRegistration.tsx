"use client";
// app/components/CompleteRegistration.tsx
import { useEffect, useState } from "react";
import axios from "axios";

interface CompleteRegistrationProps {
  challengeData: PublicKeyCredentialCreationOptionsJSON;
}

// interface CompleteRegisterRequest {
//   publicKey: PublicKeyCredential;
// }
const CompleteRegistration: React.FC<CompleteRegistrationProps> = ({
  challengeData,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credential, setCredential] = useState<PublicKeyCredential | null>(
    null
  );

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    // Make Base64 URL-safe by replacing "+" with "-" and "/" with "_"
    base64 = base64.replace(/-/g, "+").replace(/_/g, "/");

    // Decode Base64 string to a binary string
    const binaryString = atob(base64);

    // Create a new ArrayBuffer and copy the binary data into it
    const length = binaryString.length;
    const buffer = new ArrayBuffer(length);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < length; i++) {
      view[i] = binaryString.charCodeAt(i);
    }

    return buffer;
  };
  useEffect(() => {
    if (challengeData) {
      // const stringChallenge = decoder.decode(challengeData.challenge);
      // const challengeBuffer = base64ToArrayBuffer(challengeData.challenge);
      // console.log("Converted Challenge: ", challengeBuffer);
      const publicKey: PublicKeyCredentialCreationOptions = {
        ...challengeData,
        challenge: base64ToArrayBuffer(challengeData.challenge),
        user: {
          ...challengeData.user,
          id: base64ToArrayBuffer(challengeData.user.id),
        },
        excludeCredentials: challengeData.excludeCredentials?.map((cred) => ({
          ...cred,
          id: base64ToArrayBuffer(cred.id),
          transports: cred.transports as AuthenticatorTransport[] | undefined,
          type: "public-key",
        })),
        attestation:
          challengeData.attestation as AttestationConveyancePreference,
      };
      // Initialize WebAuthn registration in the browser
      const createCredential = async () => {
        try {
          // Use WebAuthn to create a credential
          const credential = await navigator.credentials.create({
            publicKey,
          });
          setCredential(credential as PublicKeyCredential);
        } catch (err) {
          console.error("Error creating WebAuthn credential:", err);
          setError("Failed to create credential");
        }
      };

      createCredential();
    }
  }, [challengeData]);

  const handleFinishRegistration = async () => {
    if (!credential) {
      alert("Credential not created yet.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send the credential to your backend to finalize the registration
      await axios.post(
        "http://localhost:8080/api/auth/register_complete",
        credential,
        {
          withCredentials: true,
        }
      );
      alert("Registration successful!");
    } catch (err) {
      console.error("Error finishing registration:", err);
      setError("Failed to finish registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Complete Passkey Registration</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Finishing registration...</p>}
      {credential && (
        <>
          <pre>{JSON.stringify(credential, null, 2)}</pre>
          <button onClick={handleFinishRegistration} disabled={loading}>
            {loading ? "Registering..." : "Finish Registration"}
          </button>
        </>
      )}
    </div>
  );
};

export default CompleteRegistration;
