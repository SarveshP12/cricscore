"use client"

import { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";

export default function Scorecard({ matchId = "gdka57B1aIrDghLS21wM" }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentInnings, setCurrentInnings] = useState(1);

  useEffect(() => {
    const matchRef = ref(db, `matches/${matchId}`);
    
    const fetchData = onValue(
      matchRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setMatchData(data);
          setCurrentInnings(data.currentInnings || 1);
        } else {
          setError("No match data available");
        }
        setLoading(false);
      },
      (error) => {
        setError("Failed to load match data");
        setLoading(false);
        console.error("Firebase error:", error);
      }
    );

    return () => off(matchRef, 'value', fetchData);
  }, [matchId]);

  if (loading) return <div className="text-center py-8">Loading match data...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!matchData) return <div className="text-center py-8">No match data found</div>;

  // Get current innings data
  const inningsData = matchData.innings?.[currentInnings] || {};
  const battingTeam = inningsData.battingTeam || 'teamA';
  const bowlingTeam = inningsData.bowlingTeam || 'teamB';
  const teamAName = matchData.teams?.teamA?.name || 'Team A';
  const teamBName = matchData.teams?.teamB?.name || 'Team B';

  // Get player stats for current innings
  const getPlayerStats = (team) => {
    return Object.entries(matchData.playerStats?.[team] || {}).map(([playerId, stats]) => ({
      id: playerId,
      name: stats.name,
      batting: stats.batting || {},
      bowling: stats.bowling || {},
      fielding: stats.fielding || {}
    }));
  };

  const battingTeamPlayers = getPlayerStats(battingTeam);
  const bowlingTeamPlayers = getPlayerStats(bowlingTeam);

  // Filter players who have batting stats
  const battingPlayers = battingTeamPlayers.filter(
    player => player.batting.ballsFaced > 0
  );

  // Filter players who have bowling stats
  const bowlingPlayers = bowlingTeamPlayers.filter(
    player => player.bowling.overs !== "0.0" && parseFloat(player.bowling.overs) > 0
  );

  // Calculate team scores
  const teamAScore = matchData.score?.teamA || { runs: 0, wickets: 0, balls: 0 };
  const teamBScore = matchData.score?.teamB || { runs: 0, wickets: 0, balls: 0 };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Match Header */}
        <header className="mb-6 bg-white p-4 rounded-lg shadow">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            {teamAName} vs {teamBName}
          </h1>
          <div className="flex flex-wrap justify-center gap-4 mt-2 text-sm md:text-base">
            <p>Venue: {matchData.matchDetails?.location || 'Unknown venue'}</p>
            <p>Status: <span className="font-semibold capitalize">{matchData.status?.replace('_', ' ')}</span></p>
            <p>Format: {matchData.matchDetails?.matchType || 'T20'}</p>
          </div>
          
          {/* Score Summary */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className={`p-3 rounded ${battingTeam === 'teamA' ? 'bg-blue-50' : 'bg-gray-100'}`}>
              <h3 className="font-bold">{teamAName}</h3>
              <p className="text-xl">
                {teamAScore.runs}/{teamAScore.wickets} ({Math.floor(teamAScore.balls/6)}.{teamAScore.balls%6} ov)
              </p>
            </div>
            <div className={`p-3 rounded ${battingTeam === 'teamB' ? 'bg-blue-50' : 'bg-gray-100'}`}>
              <h3 className="font-bold">{teamBName}</h3>
              <p className="text-xl">
                {teamBScore.runs}/{teamBScore.wickets} ({Math.floor(teamBScore.balls/6)}.{teamBScore.balls%6} ov)
              </p>
            </div>
          </div>
        </header>

        {/* Current Innings Info */}
        <div className="bg-white p-4 shadow rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-2">
            Innings {currentInnings}: {battingTeam === 'teamA' ? teamAName : teamBName} batting
          </h2>
          {inningsData.score && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-2 bg-gray-100 rounded">
                <div className="text-sm">Total</div>
                <div className="text-xl font-bold">{inningsData.score.runs}</div>
              </div>
              <div className="p-2 bg-gray-100 rounded">
                <div className="text-sm">Wickets</div>
                <div className="text-xl font-bold">{inningsData.score.wickets}</div>
              </div>
              <div className="p-2 bg-gray-100 rounded">
                <div className="text-sm">Overs</div>
                <div className="text-xl font-bold">
                  {Math.floor(inningsData.score.balls/6)}.{inningsData.score.balls%6}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Batting Scorecard */}
        {battingPlayers.length > 0 && (
          <section className="bg-white p-4 shadow rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-3 pb-2 border-b">
              Batting Scorecard - {battingTeam === 'teamA' ? teamAName : teamBName}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Batsman</th>
                    <th className="px-4 py-2 text-right">Runs</th>
                    <th className="px-4 py-2 text-right">Balls</th>
                    <th className="px-4 py-2 text-right">4s</th>
                    <th className="px-4 py-2 text-right">6s</th>
                    <th className="px-4 py-2 text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {battingPlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{player.name}</td>
                      <td className="px-4 py-2 text-right">{player.batting.runs || 0}</td>
                      <td className="px-4 py-2 text-right">{player.batting.ballsFaced || 0}</td>
                      <td className="px-4 py-2 text-right">{player.batting.fours || 0}</td>
                      <td className="px-4 py-2 text-right">{player.batting.sixes || 0}</td>
                      <td className="px-4 py-2 text-right">
                        {player.batting.strikeRate ? player.batting.strikeRate.toFixed(1) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Bowling Scorecard */}
        {bowlingPlayers.length > 0 && (
          <section className="bg-white p-4 shadow rounded-lg">
            <h2 className="text-xl font-bold mb-3 pb-2 border-b">
              Bowling Scorecard - {bowlingTeam === 'teamA' ? teamAName : teamBName}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Bowler</th>
                    <th className="px-4 py-2 text-right">Overs</th>
                    <th className="px-4 py-2 text-right">Runs</th>
                    <th className="px-4 py-2 text-right">Wkts</th>
                    <th className="px-4 py-2 text-right">Econ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bowlingPlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{player.name}</td>
                      <td className="px-4 py-2 text-right">{player.bowling.overs || '0.0'}</td>
                      <td className="px-4 py-2 text-right">{player.bowling.runs || 0}</td>
                      <td className="px-4 py-2 text-right">{player.bowling.wickets || 0}</td>
                      <td className="px-4 py-2 text-right">
                        {player.bowling.economy ? player.bowling.economy.toFixed(1) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}