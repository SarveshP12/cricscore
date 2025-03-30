'use client';
import { realtime, dbPaths } from '@/lib/firebase/client';

export const QuickInputPad = ({ matchId }) => {
  const handleRun = async (runs) => {
    await realtime.update(dbPaths.ballHistory(matchId), {
      [push().key]: { runs, timestamp: Date.now() }
    });
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {[0, 1, 2, 3, 4, 6].map((run) => (
        <button
          key={run}
          onClick={() => handleRun(run)}
          className="p-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {run}
        </button>
      ))}
    </div>
  );
};