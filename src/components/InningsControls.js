export default function InningsControls({ 
  matchStatus, 
  score, 
  currentInnings, 
  onOverComplete, 
  onEndInnings 
}) {
  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <h3 className="font-bold">Innings Controls</h3>
      
      {matchStatus === "in_progress" && (
        <button
          onClick={onOverComplete}
          className={`bg-blue-500 text-white py-2 px-4 rounded w-full hover:bg-blue-600 ${
            score.balls !== 5 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={score.balls !== 5}
        >
          Complete Over
        </button>
      )}

      {matchStatus === "in_progress" && (
        <button
          onClick={onEndInnings}
          className="bg-green-500 text-white py-2 px-4 rounded w-full hover:bg-green-600"
        >
          {currentInnings === 1 ? "End 1st Innings" : "End Match"}
        </button>
      )}
    </div>
  );
}