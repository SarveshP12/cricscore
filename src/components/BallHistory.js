"use client";
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function BallHistory({ matchId, inningsNumber }) {
  const [balls, setBalls] = useState([]);

  useEffect(() => {
    if (!matchId || !inningsNumber) return;

    const ballsRef = ref(db, `matches/${matchId}/innings/${inningsNumber}/balls`);
    const unsubscribe = onValue(ballsRef, (snapshot) => {
      if (snapshot.exists()) {
        const ballsData = snapshot.val();
        const ballsArray = Object.entries(ballsData)
          .map(([id, ball]) => ({
            id,
            ...ball,
          }))
          .sort((a, b) => b.timestamp - a.timestamp); // Newest first
        setBalls(ballsArray);
      } else {
        setBalls([]);
      }
    });

    return () => unsubscribe();
  }, [matchId, inningsNumber]);

  const getBallDescription = (ball) => {
    let description = `${ball.ballNumber}: ${ball.bowler} to ${ball.batsman} - `;
    
    if (ball.wicket) {
      description += `Wicket (${ball.wicket.type})`;
    } else if (ball.runs > 0) {
      description += `${ball.runs} run${ball.runs > 1 ? 's' : ''}`;
    } else {
      description += "Dot ball";
    }

    if (ball.extras) {
      const extraTypes = Object.keys(ball.extras);
      if (extraTypes.length > 0) {
        description += ` + ${extraTypes.map(et => `${et} (${ball.extras[et]})`).join(', ')}`;
      }
    }

    return description;
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Ball History</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {balls.length === 0 ? (
          <p>No balls recorded yet</p>
        ) : (
          balls.map((ball) => (
            <div 
              key={ball.id} 
              className={`border-b pb-2 ${ball.wicket ? 'text-red-500' : ''}`}
            >
              <p>{getBallDescription(ball)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}