"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth-store";
const NewPollPage = () => {
  const [pollName, setPollName] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { username } = useAuthStore((state) => state);
  const router = useRouter();
  useEffect(() => {
    if (!username) {
      router.push("/login");
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(true);
    }
  }, [username]);
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const removeOption = (index: number) => {
    const newOptions = pollOptions.filter((_, i) => i !== index);
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pollOptions.length < 2) {
      setError("Please provide at least two options.");
      return;
    }
    if (pollDescription.length === 0) {
      setError("Please provide a description.");
      return;
    }
    if (pollName.length === 0) {
      setError("Please provide a title.");
      return;
    }
    pollOptions.forEach((option) => {
      if (option.length === 0) {
        setError("Please provide a valid option.");
        return;
      }
    });
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/polls/create`,
        {
          poll_name: pollName,
          poll_description: pollDescription,
          poll_options: pollOptions,
        },
        {
          withCredentials: true,
        }
      );
      if (response.status !== 201) {
        throw new Error("Failed to create poll.");
      }
      alert("Poll created successfully.");
      setPollName("");
      setPollDescription("");
      setPollOptions(["", ""]);
      setError(null);
    } catch (err) {
      console.error(err);
      alert("Failed to create poll.");
      setError("Failed to create poll.");
    }
  };
  if (!isLoggedIn)
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
        <div className="text-center space-y-8 p-10 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/30 shadow-2xl">
          <div className="space-y-2">
            <h1 className="text-5xl pb-2 font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
              Poll Creator
            </h1>
            <p className="text-gray-400 text-lg font-light">
              Create new polls here 📊
            </p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-500/20 to-transparent" />
          <div className="space-y-4">
            <p className="text-gray-300 text-lg">Please sign in to continue</p>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500/80 to-violet-500/80 text-white font-medium rounded-lg hover:from-blue-600 hover:to-violet-600 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-violet-500/25"
            >
              <span>Login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-700 to-black p-4 sm:p-6 md:p-8">
      <div className="max-w-xl mx-auto p-6 bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-700/20 shadow-xl">
        <h1 className="text-3xl font-light mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
          Create Poll
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider">
              Poll Name
            </label>
            <input
              type="text"
              value={pollName}
              onChange={(e) => setPollName(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 bg-gray-800/30 border border-gray-700/50 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-400/50 text-gray-200 text-sm"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={pollDescription}
              onChange={(e) => setPollDescription(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 bg-gray-800/30 border border-gray-700/50 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-400/50 text-gray-200 text-sm h-24 resize-none"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider">
              Options
            </label>
            <div className="space-y-2 mt-1">
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required
                    className="flex-1 px-3 py-2 bg-gray-800/30 border border-gray-700/50 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-400/50 text-gray-200 text-sm"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-3 text-sm text-gray-400 hover:text-violet-400 transition-colors"
            >
              + Add Option
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 bg-violet-500/20 border border-violet-500/50 text-violet-300 rounded-md hover:bg-violet-500/30 transition-all duration-200 text-sm font-medium"
          >
            Create Poll
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPollPage;
