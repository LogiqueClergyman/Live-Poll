'use client';
// app/components/StartLogin.tsx
import { useState } from "react";
import axios from "axios";

interface StartLoginProps {
  onStart: (data: PublicKeyCredentialCreationOptionsJSON) => void;
}

interface StartLoginResponse {
  publicKey: PublicKeyCredentialCreationOptionsJSON;
}
const StartLogin: React.FC<StartLoginProps> = ({ onStart }) => {
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
      const response = await axios.post<StartLoginResponse>(
        "http://localhost:8080/api/auth/login",
        {
          username,
        },
        {
          withCredentials: true
        }
      );
      onStart(response.data.publicKey);
    } catch (err) {
      console.error("Error loggin in:", err);
      setError("Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Start Passkey Login</h2>
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
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default StartLogin;
