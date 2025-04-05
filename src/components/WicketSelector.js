import { useState } from "react";

export default function WicketSelector({ onWicket, batsmen, bowler, freeHit }) {
  const [wicketType, setWicketType] = useState("bowled");
  const [runs, setRuns] = useState(0);
  const [extras, setExtras] = useState({
    wide: 0,
    noball: 0,
    byes: 0,
    legbyes: 0,
    penalty: 0,
  });
  const [fielder, setFielder] = useState(null);
  const isDisabled = !batsmen?.striker || !batsmen?.nonStriker || !bowler;

  // Ensure valid numerical values
  const validNumber = (num) => (isNaN(num) || num === "" || num === null ? 0 : parseInt(num));

  const handleSubmit = () => {
    if (isDisabled) {
      return;
    }

    if (freeHit && wicketType !== "runout") {
      return;
    }

    onWicket({
      type: wicketType,
      runs: validNumber(runs),
      extras: Object.keys(extras).length > 0
        ? {
            wide: validNumber(extras.wide),
            noball: validNumber(extras.noball),
            byes: validNumber(extras.byes),
            legbyes: validNumber(extras.legbyes),
            penalty: validNumber(extras.penalty),
          }
        : undefined,
      fielder:
        wicketType === "caught" || wicketType === "runout" || wicketType === "stumped"
          ? { name: fielder || "Unknown" }
          : undefined,
    });

    // Reset state
    setWicketType("bowled");
    setRuns(0);
    setExtras({ wide: 0, noball: 0, byes: 0, legbyes: 0, penalty: 0 });
    setFielder(null);
  };

  const handleExtraChange = (extraType, value) => {
    setExtras((prev) => ({
      ...prev,
      [extraType]: validNumber(value),
    }));
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Wicket Selector</h3>
      {isDisabled && <p className="text-red-500 mb-2">Please select batsmen and bowler first</p>}
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

        {(wicketType === "caught" || wicketType === "runout" || wicketType === "stumped") && (
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
            onChange={(e) => setRuns(validNumber(e.target.value))}
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
              value={extras.wide}
              onChange={(e) => handleExtraChange("wide", e.target.value)}
              className="p-2 border rounded"
              min="0"
              disabled={isDisabled}
            />
            <input
              type="number"
              placeholder="No Balls"
              value={extras.noball}
              onChange={(e) => handleExtraChange("noball", e.target.value)}
              className="p-2 border rounded"
              min="0"
              disabled={isDisabled}
            />
            <input
              type="number"
              placeholder="Byes"
              value={extras.byes}
              onChange={(e) => handleExtraChange("byes", e.target.value)}
              className="p-2 border rounded"
              min="0"
              disabled={isDisabled}
            />
            <input
              type="number"
              placeholder="Leg Byes"
              value={extras.legbyes}
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
            isDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600"
          }`}
          disabled={isDisabled}
        >
          Record Wicket
        </button>
      </div>
    </div>
  );
}