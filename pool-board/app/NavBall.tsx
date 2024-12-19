"use client";
import Link from "next/link";
import React, { useState } from "react";

function NavBall() {
  const [clicked, setClicked] = useState(false);
  return (
    <div>
      <div
        className={`absolute top-2 right-2 transition-all duration-1000
                    ${
                      clicked
                        ? "bg-red-500 rounded-lg p-4 min-w-[150px]"
                        : "bg-red-500 rounded-full p-4 w-12 h-12"
                    }`}
        onClick={() => setClicked(!clicked)}
      >
        {!clicked ? (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
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
        ) : (
          <ul className="space-y-2">
            <Link href={"/"}>
              <li className="py-2 text-white hover:bg-red-600 rounded cursor-pointer">
                Polls
              </li>
            </Link>
            <Link href={"/polls/manage"}>
              <li className="py-2 text-white hover:bg-red-600 rounded cursor-pointer">
                Manage
              </li>
            </Link>
            <Link href={"/polls/new"}>
              <li className="py-2 text-white hover:bg-red-600 rounded cursor-pointer">
                Create
              </li>
            </Link>
            <li className="py-2 text-white hover:bg-red-600 rounded cursor-pointer">
              Logout
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}

export default NavBall;
