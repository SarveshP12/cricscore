export default function BallHistory({ ballHistory }) {
    return (
      <div className="mt-4">
        <h3 className="font-bold">📜 Ball-by-Ball History</h3>
        <ul>
          {ballHistory.map((ball, index) => (
            <li key={index}>{ball.isWicket ? "Wicket" : `${ball.runs} Runs`} 🏏</li>
          ))}
        </ul>
      </div>
    );
  }
  