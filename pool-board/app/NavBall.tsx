"use client";
import axios from "axios";
import { log } from "console";
import Link from "next/link";
import React, { useEffect, useState } from "react";

function NavBall() {
  const [clicked, setClicked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const ss = sessionStorage.getItem("user-info");
  useEffect(() => {
    if (ss) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [ss]);
  const logout = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/logout",
        {},
        {
          withCredentials: true,
        }
      );
      sessionStorage.removeItem("user-info");
      setIsLoggedIn(false);
      window.location.href = "/";
      alert("Logged out successfully");
      // console.log(response);
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div>
      <div
        className={`fixed top-6 right-6 transition-all duration-500 ease-in-out shadow-lg z-20
        ${
          clicked
            ? "bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 w-[150px]"
            : "bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4 w-14 h-14 hover:scale-110"
        }`}
        onClick={() => setClicked(!clicked)}
      >
        <div
          className={`transform transition-opacity duration-500 ${
            clicked ? "opacity-100" : "opacity-0"
          }`}
        >
          {clicked && (
            <ul className="space-y-3">
              <Link href={"/"}>
                <li className="px-4 py-2 text-white text-sm font-medium hover:bg-white/20 rounded-lg transition-colors duration-300">
                  Polls
                </li>
              </Link>
              <Link href={"/polls/manage"}>
                <li className="px-4 py-2 text-white text-sm font-medium hover:bg-white/20 rounded-lg transition-colors duration-300">
                  Manage
                </li>
              </Link>
              <Link href={"/polls/new"}>
                <li className="px-4 py-2 text-white text-sm font-medium hover:bg-white/20 rounded-lg transition-colors duration-300">
                  Create
                </li>
              </Link>
              {!isLoggedIn ? (
                <Link href={"/login"}>
                  <li className="px-4 py-2 text-white text-sm font-medium hover:bg-white/20 rounded-lg transition-colors duration-300">
                    Login
                  </li>
                </Link>
              ) : (
                <li
                  onClick={logout}
                  className="px-4 py-2 text-white text-sm font-medium hover:bg-white/20 rounded-lg transition-colors duration-300"
                >
                  Logout
                </li>
              )}
            </ul>
          )}
        </div>
        <div
          className={`absolute top-4 right-4 transform transition-opacity duration-500 ${
            clicked ? "opacity-0" : "opacity-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white transform transition-transform hover:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default NavBall;
