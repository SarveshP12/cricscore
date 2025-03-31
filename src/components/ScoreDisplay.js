"use client";
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function ScoreDisplay({ matchId }) {
  const [score, setScore] = useState({ 
    runs: 0, 
    wickets: 0, 
    overs: 0, 
    balls: 0,
    teamA: { runs: 0, wickets: 0 },
    teamB: { runs: 0, wickets: 0 }
  });
  const [currentInnings, setCurrentInnings] = useState(1);

  useEffect(() => {
    if (!matchId) return;
    
    const scoreRef = ref(db, `matches/${matchId}/score`);
    const inningsRef = ref(db, `matches/${matchId}/currentInnings`);
    
    onValue(scoreRef, (snapshot) => {
      setScore(snapshot.val() || { runs: 0, wickets: 0, overs: 0, balls: 0 });
    });
    
    onValue(inningsRef, (snapshot) => {
      setCurrentInnings(snapshot.val() || 1);
    });
  }, [matchId]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">Innings {currentInnings}</h2>
        <div className="text-lg">
          {score.runs}/{score.wickets} • {score.overs.toFixed(1)} Overs
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 p-3 rounded">
          <h3 className="font-semibold">Team A</h3>
          <p>{score.teamA?.runs || 0}/{score.teamA?.wickets || 0}</p>
        </div>
        <div className="bg-gray-100 p-3 rounded">
          <h3 className="font-semibold">Team B</h3>
          <p>{score.teamB?.runs || 0}/{score.teamB?.wickets || 0}</p>
        </div>
      </div>
    </div>
  );
}