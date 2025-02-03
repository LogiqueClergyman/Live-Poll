"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../store/auth-store";
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
  isActive,
}: {
  pollId: pollid;
  pollOptions: pollOptions;
  isActive: boolean;
}) {
  const [pollOptionsState, setPollOptionsState] =
    useState<PollOption[]>(pollOptions);
  const [voted, setVoted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalVotes, setTotalVotes] = useState(
    pollOptionsState.reduce((acc, option) => acc + (option.votes_count || 0), 0)
  );
  const { userId } = useAuthStore((state) => state);
  const [id, setId] = useState<string | null>(userId);
  useEffect(() => {
    if (!userId) {
      setId(null);
    } else {
      setId(userId);
    }
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

  useEffect(() => {
    setTotalVotes(
      pollOptionsState.reduce(
        (acc, option) => acc + (option.votes_count || 0),
        0
      )
    );
  }, [pollOptionsState]);

  const handleVote = async () => {
    if (voted) {
      setLoading(true);
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/polls/${pollId}/vote`,
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
        if (response.status !== 200) {
          throw new Error("Failed to vote");
        } else {
          alert("Voted successfully");
        }
        // Handle successful vote
      } catch (error) {
        alert("Probably Already Voted");
        console.error(error);
        // Handle error
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg shadow-2xl min-h-[60vh] max-h-[70vh] flex flex-col relative w-[100%] border border-gray-800">
      {(id === null || id === undefined) && (
        <div className="absolute inset-0 bg-black/15 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-purple-400 mb-4"
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
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Login to Vote
          </a>
        </div>
      )}
      {isActive === false && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
          <p className="text-purple-300 text-xl font-semibold">
            Poll has been closed
          </p>
        </div>
      )}
      <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-purple-500 hover:scrollbar-thumb-purple-400">
        {pollOptionsState.map((option) => {
          const votePercentage =
            totalVotes > 0 ? ((option.votes_count || 0) / totalVotes) * 100 : 0;
          return (
            <button
              key={option.id}
              onClick={() => setVoted(option.id)}
              disabled={loading}
              className={`w-[98%] ml-1.5 text-left px-6 py-3 my-3 rounded-lg transition-all duration-300 
          ${
            voted === option.id
              ? "outline-2 outline-double outline-offset-4 outline-purple-500 text-purple-300"
              : "hover:shadow-purple-900/30 hover:shadow-lg hover:scale-[1.02] text-gray-300 border border-gray-800"
          }
          font-medium`}
              style={{
                background: `linear-gradient(to right, rgba(147, 51, 234, 0.2) ${votePercentage}%, rgba(17, 24, 39, 0.4) ${votePercentage}%)`,
              }}
            >
              <div className="flex justify-between items-center gap-4">
                <span className="flex-1 truncate">{option.option_text}</span>
                <span className="bg-gray-800 text-purple-300 px-3 py-1 rounded-full text-sm whitespace-nowrap border border-purple-900/30">
                  {option.votes_count || 0} votes
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={handleVote}
        disabled={loading || !voted}
        className={`w-full mt-4 py-3 rounded-lg font-semibold text-white
      ${
        loading || !voted
          ? "bg-gray-800 cursor-not-allowed text-gray-500"
          : "bg-purple-600 hover:bg-purple-700 transition-colors shadow-lg hover:shadow-purple-900/50"
      }`}
      >
        {loading ? "Voting..." : "Submit Vote"}
      </button>
    </div>
  );
}

export default Vote;
