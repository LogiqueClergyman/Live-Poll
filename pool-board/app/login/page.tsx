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
      setAuthData(null);
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
          setAuthData(null);
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
          window.location.href = "/";
        } catch (err) {
          console.error("Error completing login:", err);
          setError("Failed to complete login");
          setAuthData(null);
        } finally {
          setLoading(false);
        }
      };

      completeLogin();
    }
  }, [credential, createSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-md w-full space-y-8 backdrop-blur-lg bg-gray-800/30 p-10 rounded-2xl shadow-[0_0_40px_rgba(8,_112,_184,_0.7)]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Welcome Back
          </h1>
          <p className="mt-2 text-gray-400">Sign in with your passkey</p>
        </div>

        {!authData ? (
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Enter your username"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transform transition duration-200 hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Continue with Passkey"
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800/30 text-gray-400">
                  New to our platform?
                </span>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/register"
                className="inline-block text-blue-400 hover:text-blue-300 transition duration-200"
              >
                Create an account →
              </a>
            </div>

            {error && (
              <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg backdrop-blur-sm">
                <p className="text-red-400">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg backdrop-blur-sm">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            {loading && (
              <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg backdrop-blur-sm">
                <p className="text-blue-300 flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Completing authentication...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
