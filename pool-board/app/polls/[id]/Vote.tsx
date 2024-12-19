"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count: number | null;
}
type pollid = string;
type pollOptions = PollOption[];
function Vote({
  pollId,
  pollOptions,
}: {
  pollId: pollid;
  pollOptions: pollOptions;
}) {
  const [pollOptionsState, setPollOptionsState] =
    useState<PollOption[]>(pollOptions);
  const [voted, setVoted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalVotes, setTotalVotes] = useState(
    pollOptionsState.reduce((acc, option) => acc + (option.votes_count || 0), 0)
  );
  const ss = sessionStorage.getItem("user-info");
  const userId = JSON.parse(ss ?? "{}").state?.userId;
  const [id, setId] = useState<string | null>(userId);
  console.log(id);
  useEffect(() => {
    console.log(id);
    setId(userId);
  }, [userId]);
  useEffect(() => {
    if (voted) {
      setPollOptionsState(
        pollOptions.map((option) =>
          option.id === voted
            ? { ...option, votes_count: (option.votes_count || 0) + 1 }
            : option
        )
      );
    }
  }, [voted, pollOptions]);

  const handleVote = async () => {
    if (voted) {
      setLoading(true);
      try {
        const response = await axios.post(
          `http://localhost:8080/api/polls/${pollId}/vote`,
          {
            option_id: voted,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
        if (!response.ok) {
          throw new Error("Failed to vote");
        }
        // Handle successful vote
      } catch (error) {
        console.error(error);
        // Handle error
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-xl min-h-[60vh] max-h-[70vh] flex flex-col relative w-[100%]">
      {(id === null || id === undefined) && (
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-white mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <a
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Login to Vote
          </a>
        </div>
      )}
      <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-track-gray-200 scrollbar-thumb-blue-500 hover:scrollbar-thumb-blue-600">
        {pollOptionsState.map((option) => (
          <button
            key={option.id}
            onClick={() => setVoted(option.id)}
            disabled={loading}
            className={`w-[98%] ml-1.5 text-left px-6 py-3 my-3 rounded-lg transition-all duration-300 
      ${
        voted === option.id
          ? "outline-2 outline-double outline-offset-4 outline-blue-500 text-blue-400"
          : "hover:shadow-lg hover:scale-[1.02]"
      }
      text-white font-medium`}
            style={{
              background: `linear-gradient(to right, rgba(59, 130, 246, 0.5) ${
                ((option.votes_count || 0) / totalVotes) * 100
              }%, rgba(31, 41, 55, 0.5) 0%)`,
            }}
          >
            <div className="flex justify-between items-center gap-4">
              <span className="flex-1 truncate">{option.option_text}</span>
              <span className="bg-gray-800 px-3 py-1 rounded-full text-sm whitespace-nowrap">
                {option.votes_count || 0} votes
              </span>
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={handleVote}
        disabled={loading || !voted}
        className={`w-full mt-4 py-3 rounded-lg font-semibold text-white
      ${
        loading || !voted
          ? "bg-gray-700 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 transition-colors"
      }`}
      >
        {loading ? "Voting..." : "Submit Vote"}
      </button>
    </div>
  );
}

export default Vote;
