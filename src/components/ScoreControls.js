"use client";

export default function ScoreControls({ onScoreUpdate }) {
  const handleRunClick = (runs) => {
    onScoreUpdate(runs);
  };

  const handleExtra = (extraType, runs = 0) => {
    switch (extraType) {
      case "wide":
        onScoreUpdate(runs + 1, { wide: 1 }, true); // +1 penalty + runs (if any) + extra ball
        break;
      case "noball":
        onScoreUpdate(runs + 1, { noball: 1 }, true); // +1 penalty + runs (if any) + extra ball
        break;
      case "byes":
      case "legbyes":
        onScoreUpdate(runs, { [extraType]: runs }); // Track runs as byes/legbyes
        break;
      default:
        onScoreUpdate(0, { [extraType]: 1 });
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Score Controls</h3>
      
      {/* Standard Runs (0,1,2,3,4,6) */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0, 1, 2, 3, 4, 6].map((run) => (
          <button
            key={run}
            onClick={() => handleRunClick(run)}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            {run}
          </button>
        ))}
      </div>

      {/* Extras (Wides, No Balls, Byes, Leg Byes) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Wide: Always +1 run + extra ball */}
        <button
          onClick={() => handleExtra("wide")}
          className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition-colors"
        >
          Wide (+1 run +1 ball)
        </button>

        {/* No Ball: +1 run + extra ball (can also add runs) */}
        <button
          onClick={() => handleExtra("noball")}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
        >
          No Ball (+1 run +1 ball)
        </button>

        {/* Byes: Can add runs (e.g., 2 Byes = +2 runs) */}
        <button
          onClick={() => {
            const runs = prompt("Enter Byes runs:", "0");
            if (runs !== null) handleExtra("byes", parseInt(runs) || 0);
          }}
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
        >
          Byes (+X runs)
        </button>

        {/* Leg Byes: Can add runs (e.g., 1 Leg Bye = +1 run) */}
        <button
          onClick={() => {
            const runs = prompt("Enter Leg Byes runs:", "0");
            if (runs !== null) handleExtra("legbyes", parseInt(runs) || 0);
          }}
          className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition-colors"
        >
          Leg Byes (+X runs)
        </button>
      </div>

      {/* Bonus: Runs off No Ball (e.g., 4 off a No Ball = +5 runs) */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[1, 2, 4].map((run) => (
          <button
            key={`noball-${run}`}
            onClick={() => handleExtra("noball", run)}
            className="bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors"
          >
            No Ball +{run} (Total: {run + 1})
          </button>
        ))}
      </div>
    </div>
  );
}