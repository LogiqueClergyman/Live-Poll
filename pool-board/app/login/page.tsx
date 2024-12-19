"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "../store/auth-store";

export default function LoginPage() {
  const [authData, setAuthData] =
    useState<PublicKeyCredentialRequestOptionsJSON | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credential, setCredential] = useState<PublicKeyCredential | null>(
    null
  );
  const { createSession } = useAuthStore();

  const handleStartLogin = async (
    data: PublicKeyCredentialRequestOptionsJSON
  ) => {
    setAuthData(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username) {
      alert("Please provide a username.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post<{
        publicKey: PublicKeyCredentialCreationOptionsJSON;
      }>(
        "http://localhost:8080/api/auth/login",
        { username },
        { withCredentials: true }
      );
      handleStartLogin(response.data.publicKey);
    } catch (err) {
      console.error("Error logging in:", err);
      setError("Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
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

  useEffect(() => {
    if (credential) {
      const completeLogin = async () => {
        setLoading(true);
        setError(null);

        try {
          // Send the credential to the backend to complete the login
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
          console.error("Error completing login:", err);
          setError("Failed to complete login");
        } finally {
          setLoading(false);
        }
      };

      completeLogin();
    }
  }, [credential, createSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-white mb-8">
          WebAuthn Passkey Login
        </h1>
        {!authData ? (
          <div className="space-y-6">
            <h2 className="text-xl text-gray-300 font-semibold">
              Start Passkey Login
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Username:
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition duration-200"
              >
                {loading ? "Loading..." : "Login"}
              </button>
            </form>
            {error && (
              <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg">
                <p className="text-red-500">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg">
                <p className="text-red-500">{error}</p>
              </div>
            )}
            {loading && (
              <div className="p-4 bg-blue-900/50 border border-blue-500 rounded-lg">
                <p className="text-blue-300">Finishing login...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
