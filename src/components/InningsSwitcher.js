"use client";
import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function InningsSwitcher({ matchId, currentInnings }) {
  const switchInnings = async () => {
    if (!matchId) return;
    
    try {
      const inningsRef = ref(db, `matches/${matchId}/currentInnings`);
      await update(inningsRef, currentInnings === 1 ? 2 : 1);
      
      // Reset score for new innings
      const scoreRef = ref(db, `matches/${matchId}/score`);
      await update(scoreRef, {
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0
      });
    } catch (error) {
      console.error('Error switching innings:', error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h2 className="text-xl font-bold mb-4">Match Control</h2>
      <button
        onClick={switchInnings}
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 w-full"
      >
        Switch to Innings {currentInnings === 1 ? 2 : 1}
      </button>
    </div>
  );
}