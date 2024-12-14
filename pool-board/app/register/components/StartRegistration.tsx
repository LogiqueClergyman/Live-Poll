'use client';
// app/components/StartRegistration.tsx
import { useState } from "react";
import axios from "axios";

interface StartRegistrationProps {
  onStart: (data: PublicKeyCredentialCreationOptionsJSON) => void;
}

interface StartRegisterResponse {
  publicKey: PublicKeyCredentialCreationOptionsJSON;
}
const StartRegistration: React.FC<StartRegistrationProps> = ({ onStart }) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username) {
      alert("Please provide a username.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send the request to your backend to start registration
      const response = await axios.post<StartRegisterResponse>(
        "http://localhost:8080/auth/register",
        {
          username,
        },
        {
          withCredentials: true
        }
      );

      // Pass the challenge to the parent component
      // console.log((response.data));
      onStart(response.data.publicKey);
    } catch (err) {
      console.error("Error starting registration:", err);
      setError("Failed to start registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Start Passkey Registration</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="text-black"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Start Registration"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default StartRegistration;
