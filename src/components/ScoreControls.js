export default function ScoreControls({ onScoreUpdate, batsmen, bowler }) {
  const isDisabled = !batsmen.striker || !batsmen.nonStriker || !bowler;

  const handleRunClick = (runs) => {
    if (isDisabled) {
      alert("Please select both batsmen and bowler before scoring");
      return;
    }
    onScoreUpdate(runs);
  };

  const handleExtra = (extraType) => {
    if (isDisabled) {
      alert("Please select both batsmen and bowler before scoring");
      return;
    }
    if (extraType === "wide" || extraType === "noball") {
      onScoreUpdate(0, { [extraType]: 1 });
    } else {
      onScoreUpdate(0, { [extraType]: 1 });
    }
  };

  const handlePenalty = () => {
    if (isDisabled) {
      alert("Please select both batsmen and bowler before scoring");
      return;
    }
    const runs = parseInt(prompt("Enter penalty runs (usually 5):", "5"));
    if (!isNaN(runs)) {
      onScoreUpdate(0, { penalty: runs });
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Score Controls</h3>
      {isDisabled && (
        <p className="text-red-500 mb-2">Please select batsmen and bowler first</p>
      )}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0, 1, 2, 3, 4, 6].map((run) => (
          <button
            key={run}
            onClick={() => handleRunClick(run)}
            className={`py-2 px-4 rounded ${
              isDisabled 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            disabled={isDisabled}
          >
            {run}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleExtra("wide")}
          className={`py-2 px-4 rounded ${
            isDisabled 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-yellow-500 text-white hover:bg-yellow-600'
          }`}
          disabled={isDisabled}
        >
          Wide (+1 run)
        </button>
        <button
          onClick={() => handleExtra("noball")}
          className={`py-2 px-4 rounded ${
            isDisabled 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
          disabled={isDisabled}
        >
          No Ball (+1 run)
        </button>
        <button
          onClick={() => handleExtra("byes")}
          className={`py-2 px-4 rounded ${
            isDisabled 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
          disabled={isDisabled}
        >
          Byes
        </button>
        <button
          onClick={() => handleExtra("legbyes")}
          className={`py-2 px-4 rounded ${
            isDisabled 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
          disabled={isDisabled}
        >
          Leg Byes
        </button>
      </div>
      <button
        onClick={handlePenalty}
        className={`py-2 px-4 rounded w-full ${
          isDisabled 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-gray-500 text-white hover:bg-gray-600'
        }`}
        disabled={isDisabled}
      >
        Add Penalty Runs
      </button>
    </div>
  );
}