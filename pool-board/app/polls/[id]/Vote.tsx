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
  useEffect(() => {
    setPollOptionsState((prevOptions) =>
      prevOptions.map((option) =>
        option.id === voted
          ? { ...option, votes_count: (option.votes_count || 0) + 1 }
          : option
      )
    );
    setTotalVotes((prevTotal) => prevTotal + 1);
  }, [voted]);

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
    <div>
      {pollOptionsState.map((option) => (
        <button
          key={option.id}
          onClick={() => setVoted(option.id)}
          disabled={loading}
          className={`w-full text-left px-4 py-2 my-2 rounded ${
            voted === option.id && "outline-1 outline-double outline-offset-4 outline-blue-500 text-blue-500"
          }`}
          style={{
            background: `linear-gradient(to right, #ffaf50 ${
              ((option.votes_count || 0) / totalVotes) * 100
            }%, #f0f0f0 0%)`,
          }}
        >
          {option.option_text} - {option.votes_count || 0}
        </button>
      ))}
      <button onClick={handleVote} disabled={loading || !voted}>
        Vote
      </button>
    </div>
  );
}

export default Vote;
