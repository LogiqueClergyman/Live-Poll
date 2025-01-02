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

  useEffect(() => {
    if (!ss) return;
    const userId = JSON.parse(ss ?? "{}").state.userId;
    // console.log(userId);
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
  }, [ss]);

  if (!ss) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
        <div className="text-center space-y-8 p-10 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/30 shadow-2xl">
          <div className="space-y-2">
            <h1 className="text-5xl pb-2 font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
              Poll Manager
            </h1>
            <p className="text-gray-400 text-lg font-light">
              Manage your polls here 📊
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
  }
  return (
    <div className="container mx-auto p-4 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-white">Polls</h1>
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
  const [isActive, setIsActive] = useState(poll.is_active);
  const resetVotes = async () => {
    try {
      await axios.post(
        `http://localhost:8080/api/polls/${poll.id}/reset`,
        {},
        { withCredentials: true }
      );
      alert("Poll closed successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to close poll");
    }
    setShowCloseConfirm(false);
    setIsActive(false);
  };

  const closePoll = async () => {
    try {
      await axios.post(
        `http://localhost:8080/api/polls/${poll.id}/close`,
        {},
        { withCredentials: true }
      );
      setShowResetConfirm(false);
      alert("Votes reset successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to reset votes");
    }
  };
  return (
    <li className="bg-gradient-to-tr from-black via-blue-900 to-black hover:via-purple-900 shadow-md rounded-lg p-4 cursor-pointer min-h-52">
      <div className="flex float-end items-center space-x-2 mb-3">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isActive ? "bg-green-100 text-green-800" : "bg-red-200 text-red-800"
          }`}
        >
          {isActive ? "Active" : "Closed"}
        </span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-3 hover:text-indigo-600 transition-colors duration-200 truncate">
        {poll.title}
      </h2>
      <p className="text-gray-200 text-lg font-light leading-relaxed mb-4">
        {poll.description}
      </p>
      <p className="text-gray-400 text-sm font-medium flex items-center">
        <svg
          className="w-4 h-4 mr-1 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {new Date(poll.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <>
        <div className="flex justify-start gap-3 mt-4">
          {isActive && (
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-sm font-medium text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
            >
              Close Poll
            </button>
          )}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-medium text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg"
          >
            Reset Votes
          </button>
        </div>

        {showCloseConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700/50 shadow-2xl max-w-md mx-4 backdrop-blur-lg transform transition-all">
              <p className="text-gray-100 text-xl font-light leading-relaxed mb-8">
                Are you sure you want to close this poll?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-300 hover:text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={closePoll}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-sm font-medium text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
                >
                  Close Poll
                </button>
              </div>
            </div>
          </div>
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700/50 shadow-2xl max-w-md mx-4 backdrop-blur-lg transform transition-all">
              <p className="text-gray-100 text-xl font-light leading-relaxed mb-8">
                Are you sure you want to reset this poll?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-300 hover:text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={resetVotes}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-sm font-medium text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
                >
                  Close Poll
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
