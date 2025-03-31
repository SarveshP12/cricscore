// components/LiveScorePanel.js
export default function LiveScorePanel({ match, liveData }) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2">Current Innings</h3>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Batting</p>
              <p className="font-bold">{liveData.innings["1"].battingTeam}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Score</p>
              <p className="font-bold text-2xl">
                {liveData.innings["1"].score.runs}/{liveData.innings["1"].score.wickets}
              </p>
              <p className="text-sm">
                {liveData.innings["1"].score.overs} overs
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bowling</p>
              <p className="font-bold">{liveData.innings["1"].bowlingTeam}</p>
            </div>
          </div>
        </div>
  
        {/* Add more scoring components here */}
      </div>
    );
  }