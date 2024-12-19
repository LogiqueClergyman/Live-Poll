"use client";
// app/components/CompleteLogin.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../store/auth-store";
interface CompleteLoginProps {
  authData: PublicKeyCredentialRequestOptionsJSON;
}

const CompleteLogin: React.FC<CompleteLoginProps> = ({ authData }) => {
  const { createSession } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credential, setCredential] = useState<PublicKeyCredential | null>(
    null
  );

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    // Make Base64 URL-safe by replacing "+" with "-" and "/" with "_"
    base64 = base64.replace(/-/g, "+").replace(/_/g, "/");

    const binaryString = atob(base64);

    const length = binaryString.length;
    const buffer = new ArrayBuffer(length);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < length; i++) {
      view[i] = binaryString.charCodeAt(i);
    }

    return buffer;
  };
  useEffect(() => {
    if (authData) {
      const publicKey: PublicKeyCredentialRequestOptions = {
        ...authData,
        challenge: base64ToArrayBuffer(authData.challenge),
        allowCredentials: authData.allowCredentials?.map((cred) => ({
          id: base64ToArrayBuffer(cred.id),
          type: "public-key",
        })),
        userVerification: "required",
      };
      const login = async () => {
        try {
          const credential = await navigator.credentials.get({ publicKey });
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
      const response = await axios.post(
        "http://localhost:8080/api/auth/login_complete",
        credential,
        {
          withCredentials: true,
        }
      );
      createSession(response.data.userId, response.data.username);
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
          <button onClick={handleFinishLogin} disabled={loading}>
            {loading ? "Registering..." : "Finish Login"}
          </button>
        </>
      )}
    </div>
  );
};

export default CompleteLogin;
