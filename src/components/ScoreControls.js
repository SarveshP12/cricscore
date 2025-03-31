"use client";

export default function ScoreControls({ onScoreUpdate }) {
  const handleRunClick = (runs) => {
    onScoreUpdate(runs);
  };

  const handleExtra = (extraType) => {
    onScoreUpdate(0, { [extraType]: 1 });
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Score Controls</h3>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0, 1, 2, 3, 4, 6].map((run) => (
          <button
            key={run}
            onClick={() => handleRunClick(run)}
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            {run}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleExtra("wide")}
          className="bg-yellow-500 text-white py-2 px-4 rounded"
        >
          Wide
        </button>
        <button
          onClick={() => handleExtra("noball")}
          className="bg-red-500 text-white py-2 px-4 rounded"
        >
          No Ball
        </button>
        <button
          onClick={() => handleExtra("byes")}
          className="bg-green-500 text-white py-2 px-4 rounded"
        >
          Byes
        </button>
        <button
          onClick={() => handleExtra("legbyes")}
          className="bg-purple-500 text-white py-2 px-4 rounded"
        >
          Leg Byes
        </button>
      </div>
    </div>
  );
}