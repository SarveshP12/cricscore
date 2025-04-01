export default function ScoreDisplay({ score, overProgress, batsmen, bowler, freeHit }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold text-lg mb-2">Current Score</h3>
      {(!batsmen.striker || !batsmen.nonStriker) && (
        <p className="text-red-500 text-sm mb-2">⚠️ Please select both batsmen</p>
      )}
      {!bowler && (
        <p className="text-red-500 text-sm mb-2">⚠️ Please select a bowler</p>
      )}
      <div className="flex justify-between items-center mb-4">
        <div className="text-3xl font-bold">
          {score.runs}/{score.wickets}
        </div>
        <div className="text-xl">
          Overs: {overProgress}
        </div>
      </div>
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <p className="text-sm font-medium">Striker:</p>
            <p className="font-bold">{batsmen.striker?.name || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Non-Striker:</p>
            <p className="font-bold">{batsmen.nonStriker?.name || "Not set"}</p>
          </div>
        </div>
        <div className="mb-2">
          <p className="text-sm font-medium">Bowler:</p>
          <p className="font-bold">{bowler?.name || "Not set"}</p>
        </div>
        <p className="text-sm text-gray-600">
          Extras: {Object.entries(score.extras)
            .filter(([_, value]) => value > 0)
            .map(([type, value]) => `${type}: ${value}`)
            .join(', ')}
        </p>
        {freeHit && (
          <p className="text-sm text-red-500 font-bold">FREE HIT</p>
        )}
      </div>
    </div>
  );
}