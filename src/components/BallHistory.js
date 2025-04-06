export default function BallHistory({ balls }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Ball History</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {balls.length === 0 ? (
          <p>No balls recorded yet</p>
        ) : (
          balls.map((ball) => (
            <div 
              key={ball.id} 
              className={`border-b pb-2 ${ball.wicket ? 'text-red-500' : ''} ${ball.isFreeHit ? 'bg-yellow-50' : ''}`}
            >
              <p>{`${ball.over}.${ball.ball}: ${ball.bowler?.name || 'Bowler'} to ${ball.batsman?.name || 'Batsman'}`}</p>
              <p className="text-sm">
                {ball.wicket ? `Wicket (${ball.wicket.type})` :
                ball.runs > 0 ? `${ball.runs} run${ball.runs > 1 ? 's' : ''}` : "Dot ball"}
                {ball.extras ? ` + ${Object.entries(ball.extras)
                  .filter(([_, value]) => value > 0)
                  .map(([type, value]) => `${type} (${value})`)
                  .join(', ')}` : ''}
                {ball.isFreeHit ? ' [FREE HIT]' : ''}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}