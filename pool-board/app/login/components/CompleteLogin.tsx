"use client";
// app/components/CompleteLogin.tsx
import { useEffect, useState } from "react";
import axios from "axios";

interface CompleteLoginProps {
  authData: PublicKeyCredentialRequestOptionsJSON;
}

// interface CompleteRegisterRequest {
//   publicKey: PublicKeyCredential;
// }
const CompleteLogin: React.FC<CompleteLoginProps> = ({ authData }) => {
  console.log(authData);
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
    console.log("useEffect");
    if (authData) {
      // const stringChallenge = decoder.decode(authData.challenge);
      // const challengeBuffer = base64ToArrayBuffer(authData.challenge);
      // console.log("Converted Challenge: ", challengeBuffer);
      console.log(authData);
      const publicKey: PublicKeyCredentialRequestOptions = {
        ...authData,
        challenge: base64ToArrayBuffer(authData.challenge),
        allowCredentials: authData.allowCredentials?.map((cred) => ({
          id: base64ToArrayBuffer(cred.id),
          type: "public-key",
        })),
        userVerification: "required",
      };
      console.log(publicKey);
      const login = async () => {
        try {
          console.log("login");
          const credential = await navigator.credentials.get({ publicKey });
          console.log("creds", credential);
          setCredential(credential as PublicKeyCredential);
        } catch (err) {
          console.error("Error getting credential:", err);
          setError("Failed to get credential");
        }
      };

      login();
    }
  }, [authData]);

  const handleFinishLogin = async () => {
    if (!credential) {
      alert("Credential not created yet.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send the credential to your backend to finalize the registration
      await axios.post(
        "http://localhost:8080/auth/login_complete",
        credential,
        {
          withCredentials: true,
        }
      );
      alert("Login successful!");
    } catch (err) {
      console.error("Error loggin in:", err);
      setError("Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Complete Passkey Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p className="text-white">Finishing registration...</p>}
      {credential && (
        <>
          <pre>{JSON.stringify(credential, null, 2)}</pre>
          <button onClick={handleFinishLogin} disabled={loading}>
            {loading ? "Registering..." : "Finish Login"}
          </button>
        </>
      )}
    </div>
  );
};

export default CompleteLogin;
