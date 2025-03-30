export default function ScoreControls({ updateScore, undoLastBall }) {
    return (
      <div className="flex gap-4 mt-4">
        {[0, 1, 2, 3, 4, 6].map((run) => (
          <button key={run} onClick={() => updateScore(run)} className="bg-blue-500 text-white px-4 py-2 rounded">
            +{run} Runs
          </button>
        ))}
        <button onClick={() => updateScore(0, true)} className="bg-red-500 text-white px-4 py-2 rounded">Wicket</button>
        <button onClick={undoLastBall} className="bg-gray-500 text-white px-4 py-2 rounded">Undo</button>
      </div>
    );
  }
  