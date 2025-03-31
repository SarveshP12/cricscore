"use client";
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function ScoreDisplay({ matchId, currentInnings }) {
  const [score, setScore] = useState({
    runs: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!matchId || !currentInnings) return;

    setIsLoading(true);
    
    // Listen to score changes
    const scoreRef = ref(db, `matches/${matchId}/innings/${currentInnings}/score`);
    
    // Listen to balls collection for real-time updates
    const ballsRef = ref(db, `matches/${matchId}/innings/${currentInnings}/balls`);
    
    const unsubscribeScore = onValue(scoreRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setScore(prev => ({
            ...prev,
            runs: data.runs ?? 0,
            wickets: data.wickets ?? 0,
            overs: data.overs ?? 0,
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

    // Additional listener for ball-by-ball updates to force re-render
    const unsubscribeBalls = onValue(ballsRef, () => {
      // This forces the component to check for latest score
      // when a new ball is recorded
      setScore(prev => ({ ...prev }));
    });

    return () => {
      unsubscribeScore();
      unsubscribeBalls();
    };
  }, [matchId, currentInnings]);

  // Calculate current over progress
  const formatOvers = () => {
    const totalBalls = score.balls;
    const overs = Math.floor(totalBalls / 6);
    const balls = totalBalls % 6;
    return `${overs}.${balls}`;
  };

  if (isLoading) return <div className="text-center py-4">Loading score...</div>;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold text-lg mb-2">Current Score</h3>
      <div className="flex justify-between items-center">
        <div className="text-3xl font-bold">
          {score.runs}/{score.wickets}
        </div>
        <div className="text-xl">
          Overs: {formatOvers()}
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Extras: {Object.entries(score.extras)
          .filter(([_, value]) => value > 0)
          .map(([type, value]) => `${type}: ${value}`)
          .join(', ')}
      </div>
    </div>
  );
}