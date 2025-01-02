"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function RegistrationPage() {
  const [challengeData, setChallengeData] =
    useState<PublicKeyCredentialCreationOptionsJSON | null>(null);
  const [credential, setCredential] = useState<PublicKeyCredential | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");

  // Base64 to ArrayBuffer conversion utility
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

  // Start Registration process
  const handleStartRegistration = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!username) {
      alert("Please provide a username.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/register",
        { username },
        { withCredentials: true }
      );

      // Set challengeData from backend response
      setChallengeData(response.data.publicKey);
    } catch (err) {
      console.error("Error starting registration:", err);
      setError("Failed to start registration");
      setChallengeData(null);
    } finally {
      setLoading(false);
    }
  };

  // Automatically handle credential creation and registration completion
  useEffect(() => {
    if (challengeData) {
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

      const createCredential = async () => {
        try {
          const createdCredential = await navigator.credentials.create({
            publicKey,
          });
          setCredential(createdCredential as PublicKeyCredential);
        } catch (err) {
          console.error("Error creating WebAuthn credential:", err);
          setError("Failed to create credential");
          setChallengeData(null);
        }
      };

      createCredential();
    }
  }, [challengeData]);

  // Automatically finish the registration once the credential is created
  useEffect(() => {
    if (credential) {
      const completeRegistration = async () => {
        setLoading(true);
        setError(null);

        try {
          // Send the credential to your backend to complete the registration
          await axios.post(
            "http://localhost:8080/api/auth/register_complete",
            credential,
            { withCredentials: true }
          );
          alert("Registration successful!");
          window.location.href = "/login";
        } catch (err) {
          console.error("Error finishing registration:", err);
          setError("Failed to finish registration");
          setChallengeData(null);
        } finally {
          setLoading(false);
        }
      };
      completeRegistration();
    }
  }, [credential]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-md w-full space-y-8 backdrop-blur-lg bg-gray-800/30 p-10 rounded-2xl shadow-[0_0_40px_rgba(8,_112,_184,_0.7)]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Secure Registration
          </h1>
          <p className="mt-2 text-gray-400">Create your account with passkey</p>
        </div>

        {!challengeData ? (
          <div className="space-y-6">
            <form onSubmit={handleStartRegistration} className="space-y-6">
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
                  "Register with Passkey"
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600">
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800/30 text-gray-400">
                      Already have an account?
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/login"
                className="inline-block pt-2 text-blue-400 hover:text-blue-300 transition duration-200"
              >
                Sign in
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
                  Finalizing your registration...
                </p>
              </div>
            )}
            {credential && (
              <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg backdrop-blur-sm">
                <p className="text-green-400 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  Registration completed successfully!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
