export default function ScoreDisplay({ score }) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-bold">🏏 Live Score</h3>
        <p>Runs: {score.runs}</p>
        <p>Wickets: {score.wickets}</p>
        <p>Overs: {score.overs}</p>
      </div>
    );
  }
  