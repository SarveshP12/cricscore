import { useState } from "react";

export default function WicketSelector({ onWicket, batsmen, bowler, freeHit }) {
  const [wicketType, setWicketType] = useState("bowled");
  const [runs, setRuns] = useState(0);
  const [extras, setExtras] = useState({});
  const [fielder, setFielder] = useState(null);
  const isDisabled = !batsmen.striker || !batsmen.nonStriker || !bowler;

  const handleSubmit = () => {
    if (isDisabled) {
      alert("Please select both batsmen and bowler before recording a wicket");
      return;
    }
    
    if (freeHit && wicketType !== 'runout') {
      alert("Cannot be dismissed on a free hit (except run out)");
      return;
    }
    
    onWicket({
      type: wicketType,
      runs: runs,
      extras: Object.keys(extras).length > 0 ? {
        wide: extras.wide || 0,
        noball: extras.noball || 0,
        byes: extras.byes || 0,
        legbyes: extras.legbyes || 0,
        penalty: extras.penalty || 0
      } : undefined,
      fielder: wicketType === 'caught' || wicketType === 'runout' || wicketType === 'stumped' ? 
        { name: fielder || 'Unknown' } : undefined
    });
    setWicketType("bowled");
    setRuns(0);
    setExtras({});
    setFielder(null);
  };

  const handleExtraChange = (extraType, value) => {
    setExtras(prev => ({
      ...prev,
      [extraType]: value ? parseInt(value) : 0
    }));
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Wicket Selector</h3>
      {isDisabled && (
        <p className="text-red-500 mb-2">Please select batsmen and bowler first</p>
      )}
      <div className="space-y-4">
        <div>
          <label className="block mb-1">Wicket Type</label>
          <select
            value={wicketType}
            onChange={(e) => setWicketType(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isDisabled}
          >
            <option value="bowled">Bowled</option>
            <option value="caught">Caught</option>
            <option value="lbw">LBW</option>
            <option value="runout">Run Out</option>
            <option value="stumped">Stumped</option>
            <option value="hitwicket">Hit Wicket</option>
            <option value="obstructing">Obstructing the Field</option>
          </select>
        </div>

        {(wicketType === 'caught' || wicketType === 'runout' || wicketType === 'stumped') && (
          <div>
            <label className="block mb-1">Fielder</label>
            <input
              type="text"
              value={fielder || ""}
              onChange={(e) => setFielder(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter fielder name"
              disabled={isDisabled}
            />
          </div>
        )}

        <div>
          <label className="block mb-1">Runs before wicket</label>
          <input
            type="number"
            value={runs}
            onChange={(e) => setRuns(e.target.value ? parseInt(e.target.value) : 0)}
            className="w-full p-2 border rounded"
            min="0"
            disabled={isDisabled}
          />
        </div>

        <div>
          <label className="block mb-1">Extras (if any)</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Wides"
              value={extras.wide || ""}
              onChange={(e) => handleExtraChange("wide", e.target.value)}
              className="p-2 border rounded"
              min="0"
              disabled={isDisabled}
            />
            <input
              type="number"
              placeholder="No Balls"
              value={extras.noball || ""}
              onChange={(e) => handleExtraChange("noball", e.target.value)}
              className="p-2 border rounded"
              min="0"
              disabled={isDisabled}
            />
            <input
              type="number"
              placeholder="Byes"
              value={extras.byes || ""}
              onChange={(e) => handleExtraChange("byes", e.target.value)}
              className="p-2 border rounded"
              min="0"
              disabled={isDisabled}
            />
            <input
              type="number"
              placeholder="Leg Byes"
              value={extras.legbyes || ""}
              onChange={(e) => handleExtraChange("legbyes", e.target.value)}
              className="p-2 border rounded"
              min="0"
              disabled={isDisabled}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className={`py-2 px-4 rounded w-full ${
            isDisabled 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
          disabled={isDisabled}
        >
          Record Wicket
        </button>
      </div>
    </div>
  );
}