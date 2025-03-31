"use client";
import { useState } from 'react';
import { ref, update, increment } from 'firebase/database';
import { db } from '@/lib/firebase'; // Adjust import path as needed

export default function ScoreControls({ matchId }) {
  const [extraType, setExtraType] = useState(null);
  const [overthrowRuns, setOverthrowRuns] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateScore = async (runs, isWicket = false) => {
    setIsUpdating(true);
    try {
      const scoreRef = ref(db, `matches/${matchId}/score`);
      const updates = {
        runs: increment(runs),
        ...(isWicket && { wickets: increment(1) }),
        ...(extraType && { [extraType]: increment(1) }),
        ...(overthrowRuns > 0 && { overthrows: increment(overthrowRuns) }),
        lastUpdated: Date.now()
      };
      
      await update(scoreRef, updates);
      console.log('Score updated successfully');
      resetExtras();
    } catch (error) {
      console.error("Error updating score:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRunClick = (runs) => {
    updateScore(runs);
  };

  const handleWicketClick = () => {
    updateScore(0, true);
  };

  const resetExtras = () => {
    setExtraType(null);
    setOverthrowRuns(0);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h2 className="text-xl font-bold mb-4">Score Controls</h2>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0, 1, 2, 3, 4, 6].map((run) => (
          <button
            key={run}
            onClick={() => handleRunClick(run)}
            disabled={isUpdating}
            className={`p-2 rounded text-white ${
              isUpdating ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {run}
          </button>
        ))}
        <button
          onClick={handleWicketClick}
          disabled={isUpdating}
          className={`p-2 rounded text-white col-span-3 ${
            isUpdating ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          Wicket
        </button>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Extras</h3>
        <div className="grid grid-cols-2 gap-2">
          {['wide', 'noball', 'byes', 'legbyes'].map((type) => (
            <button
              key={type}
              onClick={() => setExtraType(type)}
              disabled={isUpdating}
              className={`p-2 rounded ${
                extraType === type 
                  ? 'bg-green-500 text-white' 
                  : isUpdating 
                    ? 'bg-gray-200' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
            </button>
          ))}
        </div>
      </div>

      {extraType && (
        <div className="mb-4">
          <label className="block mb-2">
            Overthrow Runs:
            <input
              type="number"
              min="0"
              max="10"
              value={overthrowRuns}
              onChange={(e) => setOverthrowRuns(Math.min(10, parseInt(e.target.value) || 0))}
              disabled={isUpdating}
              className="ml-2 p-1 border rounded w-16"
            />
          </label>
        </div>
      )}

      {isUpdating && (
        <div className="text-center text-blue-500">Updating score...</div>
      )}
    </div>
  );
}