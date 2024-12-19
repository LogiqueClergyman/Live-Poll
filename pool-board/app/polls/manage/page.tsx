"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../store/auth-store";
import Link from "next/link";

type Poll = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
};

function Page() {
  const [polls, setPolls] = React.useState<Poll[]>([]);
  const ss = sessionStorage.getItem("user-info");
  const userId = JSON.parse(ss ?? "{}").state.userId;
  useEffect(() => {
    console.log(userId);
    const fetchPolls = async () => {
      const response = await axios.get(
        "http://localhost:8080/api/polls/?creator=" + userId,
        {
          withCredentials: true,
        }
      );
      setPolls(response.data);
    };
    fetchPolls();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Polls</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {polls.map((poll) => (
          <div key={poll.id} className="hover:shadow-md">
            <PollItem poll={poll} />
          </div>
        ))}
      </ul>
    </div>
  );
}
const PollItem = ({ poll }: { poll: Poll }) => {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  return (
    <li className="bg-white shadow-md rounded-lg p-4 cursor-pointer">
      <h2 className="text-xl font-semibold mb-2">{poll.title}</h2>
      <p className="text-gray-700 mb-2">{poll.description}</p>
      <div className="text-gray-500 mb-2">
        <p>Active: {poll.is_active ? "Yes" : "No"}</p>
      </div>
      <p className="text-gray-500">
        Created at: {new Date(poll.created_at).toLocaleString()}
      </p>
      <>
        <div className="flex justify-start gap-2 mt-4">
          <button
            onClick={() => setShowCloseConfirm(true)}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Close Poll
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="bg-yellow-500 text-white px-3 py-1 rounded"
          >
            Reset Votes
          </button>
        </div>

        {showCloseConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg">
              <p>Are you sure you want to close this poll?</p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="px-3 py-1 bg-gray-200 rounded"
                >
                  No
                </button>
                <button
                  onClick={async () => {
                    await axios.post(
                      `http://localhost:8080/api/polls/${poll.id}/close`,
                      {},
                      {
                        withCredentials: true,
                      }
                    );
                    setShowCloseConfirm(false);
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg">
              <p>Are you sure you want to reset all votes?</p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1 bg-gray-200 rounded"
                >
                  No
                </button>
                <button
                  onClick={async () => {
                    await axios.post(
                      `http://localhost:8080/api/polls/${poll.id}/reset`,
                      {},
                      {
                        withCredentials: true,
                      }
                    );
                    setShowResetConfirm(false);
                  }}
                  className="px-3 py-1 bg-yellow-500 text-white rounded"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </li>
  );
};

export default Page;
