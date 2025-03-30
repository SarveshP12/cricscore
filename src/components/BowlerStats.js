"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, update, onValue } from "firebase/database";

export default function BowlerStats({ matchId, bowlerId }) {
  const [bowler, setBowler] = useState(null);

  useEffect(() => {
    if (!matchId || !bowlerId) return;

    const bowlerRef = ref(db, `matches/${matchId}/bowlerStats/${bowlerId}`);
    
    // Fetch bowler stats in real-time
    const unsubscribe = onValue(bowlerRef, (snapshot) => {
      setBowler(snapshot.val());
    });

    return () => unsubscribe();
  }, [matchId, bowlerId]);

  if (!bowler) return <p>Loading bowler stats...</p>;

  return (
    <div className="p-4 bg-gray-200 rounded-lg shadow">
      <h2 className="text-xl font-bold">{bowler.name} 🎯</h2>
      <p>Overs: {bowler.overs.toFixed(1)}</p>
      <p>Runs Conceded: {bowler.runsConceded}</p>
      <p>Wickets: {bowler.wickets}</p>
      <p>Economy: {(bowler.runsConceded / (bowler.overs || 1)).toFixed(2)}</p>
    </div>
  );
}
