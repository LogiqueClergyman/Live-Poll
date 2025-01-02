"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Chart from "./Chart";
import Vote from "./Vote";
import Live from "./Live";

type Params = Promise<{ id: string }>;

interface PollData {
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
  options: PollOption[];
}

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count: number | null;
}

const Page = ({ params }: { params: Params }) => {
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [id, setId] = useState<string | null>(null);
  const fetchPollData = async () => {
    try {
      const { id } = await params;
      setId(id);
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/polls/${id}`);
      setPollData(data);
    } catch (error) {
      console.error("Failed to fetch poll data:", error);
    }
  };
  useEffect(() => {
    fetchPollData();
  }, []);
  return (
    <div className="p-8 mx-auto min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-center text-3xl font-bold text-white mb-4">
          {pollData?.title}
        </h1>
        <p className="text-center text-gray-400 mb-8">
          {pollData?.description}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="col-span-2 bg-gray-800 rounded-lg p-6 shadow-lg lg:grid lg:grid-cols-2 gap-6">
            <Live pollId={id === null ? "" : id} />
            <div className="w-full min-h-[300px] lg:min-h-0">
              {id !== null && <Chart />}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg shadow-lg">
            {pollData && (
              <Vote
                pollId={id === null ? "" : id}
                pollOptions={pollData.options}
                isActive={pollData.is_active}
              />
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-lg text-center">
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-400">
            <div>
              <p className="font-medium">Created by</p>
              <p className="text-gray-300">User ID: {pollData?.user_id}</p>
            </div>
            <div>
              <p className="font-medium">Created at</p>
              <p className="text-gray-300">
                {pollData?.created_at
                  ? new Date(pollData.created_at).toLocaleString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="font-medium">Status</p>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  pollData?.is_active
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {pollData?.is_active ? "Active" : "Closed"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
