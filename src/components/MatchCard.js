"use client";
import React from "react";

export default function MatchCard({ match }) {
  // Default match data from the image
  const defaultMatch = {
    createdAt: 1743455236179,
    id: "DBd4DefhTOF4bksEspkB",
    location: "NMIMS, Navi Mumbai",
    matchDate: "2025-04-01",
    matchName: "SP",
    matchTime: '02:38',
    matchType: "Casual",
    status: "upcoming",
    teamA: "Bhumiraj",
    teamB: "Twins",
    totalOvers: "2",
    updatedAt: null
  };

  // Merge incoming match props with default values
  const matchData = { ...defaultMatch, ...match };

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    try {
      const [year, month, day] = dateString.split("-");
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = () => {
    switch (matchData.status?.toLowerCase()) {
      case "upcoming": return "bg-blue-100 text-blue-800";
      case "live": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="bg-white p-5 border-l-4 border-l-blue-500 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Status Badge + Overs */}
      <div className="flex justify-between items-center mb-3">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
          {matchData.status || "Upcoming"}
        </span>
        <span className="px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded-full">
          {matchData.totalOvers || "N/A"} Overs
        </span>
      </div>

      {/* Match Name */}
      <h3 className="text-xl font-bold mb-3 text-gray-800">
        🏏 {matchData.teamA} vs {matchData.teamB}
      </h3>

      {/* Teams with Scores */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
          <span className="font-medium text-gray-700">{matchData.teamA || "Team A"}</span>
          {matchData.teamAScore && (
            <span className="font-bold">
              {matchData.teamAScore.runs}/{matchData.teamAScore.wickets}
              <span className="text-xs ml-1">({matchData.teamAScore.balls}b)</span>
            </span>
          )}
        </div>
        <div className="text-xs font-bold text-gray-500 text-center">VS</div>
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
          <span className="font-medium text-gray-700">{matchData.teamB || "Team B"}</span>
          {matchData.teamBScore && (
            <span className="font-bold">
              {matchData.teamBScore.runs}/{matchData.teamBScore.wickets}
              <span className="text-xs ml-1">({matchData.teamBScore.balls}b)</span>
            </span>
          )}
        </div>
      </div>

      {/* Match Info */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center text-gray-600">
          📍 {matchData.location || "Location not set"}
        </div>
        <div className="flex items-center text-gray-600">
          ⏰ {matchData.matchTime || "Time not set"}
        </div>
        <div className="col-span-2 flex items-center text-gray-600">
          📅 {formatDate(matchData.matchDate)}
        </div>
        <div className="col-span-2 flex items-center text-gray-600">
          🏷️ {matchData.matchType || "Match type not set"}
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded transition-colors">
        {matchData.status === "upcoming" ? "View Details" : 
         matchData.status === "live" ? "Follow Live" : "View Scorecard"}
      </button>
    </div>
  );
}