"use client";
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [active, setActive] = useState("home");

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">🏏 CricScore</h1>
        <ul className="flex space-x-6">
          <li>
            <Link
              href="/scorer-dashboard"
              className={`hover:text-yellow-300 ${
                active === "host-match" ? "text-yellow-300 font-bold" : ""
              }`}
              onClick={() => setActive("host-match")}
            >
              Host Match
            </Link>
          </li>
          <li>
            <Link
              href="/host-tournament"
              className={`hover:text-yellow-300 ${
                active === "host-tournament" ? "text-yellow-300 font-bold" : ""
              }`}
              onClick={() => setActive("host-tournament")}
            >
              Host Tournament
            </Link>
          </li>
          <li>
            <Link
              href="/all-matches"
              className={`hover:text-yellow-300 ${
                active === "viewer" ? "text-yellow-300 font-bold" : ""
              }`}
              onClick={() => setActive("viewer")}
            >
              Be a Viewer
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
