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
      // Send the request to your backend to start registration
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
        } finally {
          setLoading(false);
        }
      };
      completeRegistration();
    }
  }, [credential]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Passkey Registration
        </h1>

        {!challengeData ? (
          <form onSubmit={handleStartRegistration} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Register with Passkey"}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </form>
        ) : (
          <div className="mt-8 space-y-4">
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            {loading && (
              <p className="text-gray-600 text-center">
                Finishing registration...
              </p>
            )}
            {credential && (
              <div className="space-y-4">
                {/* <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(credential, null, 2)}
                  </pre>
                </div> */}
                <p className="text-green-600 font-medium text-center">
                  Registration is complete!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
