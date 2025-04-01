"use client";
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function ScoreDisplay({ matchId, currentInnings }) {
  const [score, setScore] = useState({
    runs: 0,
    wickets: 0,
    balls: 0,
    extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0 }
  });
  const [totalRuns, setTotalRuns] = useState(0);
  const [matchStatus, setMatchStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!matchId || !currentInnings) return;

    setIsLoading(true);
    
    const scoreRef = ref(db, `matches/${matchId}/innings/${currentInnings}/score`);
    const ballsRef = ref(db, `matches/${matchId}/innings/${currentInnings}/balls`);
    const statusRef = ref(db, `matches/${matchId}/status`);
    
    const unsubscribeScore = onValue(scoreRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setScore(prev => ({
            ...prev,
            runs: data.runs ?? 0,
            wickets: data.wickets ?? 0,
            balls: data.balls ?? 0,
            extras: data.extras || { wides: 0, noballs: 0, byes: 0, legbyes: 0 }
          }));
        }
        setError(null);
      } catch (err) {
        setError("Error loading score data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    });

    const unsubscribeBalls = onValue(ballsRef, (snapshot) => {
      if (snapshot.exists()) {
        const ballsData = snapshot.val();
        const runsTotal = Object.values(ballsData).reduce((sum, ball) => {
          return sum + (ball.runs || 0);
        }, 0);
        setTotalRuns(runsTotal);
      }
    });

    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      setMatchStatus(snapshot.val() || "");
    });

    return () => {
      unsubscribeScore();
      unsubscribeBalls();
      unsubscribeStatus();
    };
  }, [matchId, currentInnings]);

  // Calculate over progress by dividing balls by 6
  const overProgress = (score.balls / 6).toFixed(1);

  if (isLoading) return <div className="text-center py-4">Loading score...</div>;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold text-lg mb-2">Current Score</h3>
      <div className="mb-4">
        <p>Current Over: {overProgress}</p>
        <p>Match Status: {matchStatus}</p>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-3xl font-bold">
          {totalRuns}/{score.wickets}
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        <p>Extras: {Object.entries(score.extras)
          .filter(([_, value]) => value > 0)
          .map(([type, value]) => `${type}: ${value}`)
          .join(', ')}</p>
      </div>
    </div>
  );
}