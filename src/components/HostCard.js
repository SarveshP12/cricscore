import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MatchCard({ match }) {
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    // Check if the match is already started
    const storedMatchStatus = localStorage.getItem(`match_started_${match.id}`);
    if (storedMatchStatus === "true") {
      setIsStarted(true);
    }
  }, [match.id]);

  const handleStartMatch = () => {
    localStorage.setItem(`match_started_${match.id}`, "true"); // Store match start status
    setIsStarted(true);
    router.push(`/score-match/${match.id}`); // Redirect to match scoring page
  };

  return (
    <div className="bg-white p-4 border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] rounded-lg cursor-pointer hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all">
      {/* Match Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold">{match.matchType}</span>
        <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full">
          {match.casualOvers} Overs
        </span>
      </div>

      {/* Match Name */}
      <h3 className="text-xl font-bold mb-2">🏏 {match.matchName}</h3>

      {/* Location */}
      <p className="text-sm text-gray-600 mb-1">📍 {match.location}</p>

      {/* Match Date & Time */}
      <p className="text-sm text-gray-500">📅 {match.matchDate} | ⏰ {match.matchTime}</p>

      {/* Start/Resume Match Button */}
      <button
        onClick={handleStartMatch}
        className="mt-3 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all w-full"
      >
        {isStarted ? "Resume Match" : "Start Match"}
      </button>
    </div>
  );
}
