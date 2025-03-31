"use client";
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function BallHistory({ matchId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!matchId) return;
    
    const historyRef = ref(db, `matches/${matchId}/ballHistory`);
    onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || [];
      // Convert object to array if needed
      const historyArray = Array.isArray(data) ? data : Object.values(data);
      setHistory(historyArray.reverse());
    });
  }, [matchId]);

  const formatBall = (ball) => {
    if (ball.isWicket) return 'W';
    if (ball.extraType === 'wide') return `${ball.runs + 1}wd`;
    if (ball.extraType === 'noball') return `${ball.runs + 1}nb`;
    return ball.runs;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Ball History</h2>
      <div className="flex flex-wrap gap-2">
        {history.map((ball, index) => (
          <div 
            key={index} 
            className={`p-2 rounded-full w-10 h-10 flex items-center justify-center 
              ${ball.isWicket ? 'bg-red-500 text-white' : 
                ball.runs === 4 ? 'bg-blue-100 text-blue-800' :
                ball.runs === 6 ? 'bg-green-100 text-green-800' :
                'bg-gray-100'}`}
          >
            {formatBall(ball)}
          </div>
        ))}
      </div>
    </div>
  );
}