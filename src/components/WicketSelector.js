"use client";
import { useState } from "react";

export default function WicketSelector({ onWicket }) {
  const [wicketType, setWicketType] = useState("bowled");
  const [runs, setRuns] = useState(0);
  const [extras, setExtras] = useState({});

  const handleSubmit = () => {
    onWicket({
      type: wicketType,
      runs,
      extras: Object.keys(extras).length > 0 ? extras : undefined,
    });
    setWicketType("bowled");
    setRuns(0);
    setExtras({});
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Wicket Selector</h3>
      <div className="space-y-4">
        <div>
          <label className="block mb-1">Wicket Type</label>
          <select
            value={wicketType}
            onChange={(e) => setWicketType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="bowled">Bowled</option>
            <option value="caught">Caught</option>
            <option value="lbw">LBW</option>
            <option value="runout">Run Out</option>
            <option value="stumped">Stumped</option>
            <option value="hitwicket">Hit Wicket</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Runs before wicket</label>
          <input
            type="number"
            value={runs}
            onChange={(e) => setRuns(parseInt(e.target.value) || 0)}
            className="w-full p-2 border rounded"
            min="0"
          />
        </div>

        <div>
          <label className="block mb-1">Extras (if any)</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setExtras({ ...extras, wide: 1 })}
              className={`py-1 px-2 rounded ${extras.wide ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
            >
              Wide
            </button>
            <button
              onClick={() => setExtras({ ...extras, noball: 1 })}
              className={`py-1 px-2 rounded ${extras.noball ? "bg-red-500 text-white" : "bg-gray-200"}`}
            >
              No Ball
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="bg-red-500 text-white py-2 px-4 rounded w-full"
        >
          Record Wicket
        </button>
      </div>
    </div>
  );
}