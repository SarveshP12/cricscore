"use client";
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function BatsmanStats({ matchId, batsmanId, currentInnings, onStrikeChange }) {
  const [stats, setStats] = useState({
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
  });

  // Handle strike rotation logic
  const handleStrikeRotation = (runs) => {
    if (runs % 2 !== 0 && runs !== 4 && runs !== 6) {
      if (typeof onStrikeChange === "function") {
        onStrikeChange();
      }
    }
  };

  useEffect(() => {
    if (!matchId || !batsmanId || !currentInnings) return;

    const statsRef = ref(db, `matches/${matchId}/playerStats/team${currentInnings === 1 ? "A" : "B"}/${batsmanId}/batting`);

    onValue(statsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const newStats = {
        runs: data.runs || 0,
        balls: data.ballsFaced || 0,
        fours: data.fours || 0,
        sixes: data.sixes || 0,
      };

      setStats((prevStats) => {
        if (prevStats.runs !== newStats.runs) {
          handleStrikeRotation(newStats.runs - prevStats.runs);
        }
        return newStats;
      });
    });
  }, [matchId, batsmanId, currentInnings]);

  // Strike rate calculation
  const strikeRate = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(2) : "0.00";

  if (!batsmanId) return <div className="bg-white p-4 rounded shadow">No batsman selected</div>;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Batsman Stats</h3>
      <div className="grid grid-cols-2 gap-2">
        <p>Runs: <span className="font-bold">{stats.runs}</span></p>
        <p>Balls: <span className="font-bold">{stats.balls}</span></p>
        <p>Fours: <span className="font-bold">{stats.fours}</span></p>
        <p>Sixes: <span className="font-bold">{stats.sixes}</span></p>
        <p>Strike Rate: <span className="font-bold">{strikeRate}</span></p>
        <p>Boundaries: <span className="font-bold">{stats.fours + stats.sixes} ({stats.fours}x4, {stats.sixes}x6)</span></p>
      </div>
    </div>
  );
}