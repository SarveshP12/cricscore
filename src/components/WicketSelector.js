"use client";
import { useState } from "react";
import PlayerSelector from "@/components/PlayerSelector"; // ✅ Make sure this import is correct

export default function WicketSelector({ matchId }) {
  const [selectedBatsman, setSelectedBatsman] = useState("");

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">Wicket Selector</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <PlayerSelector
            matchId={matchId}
            team="A"
            role="Batsman"
            onSelect={setSelectedBatsman}
          />
        </div>
      </div>

      <button
        className="bg-red-500 text-white px-4 py-2 rounded mt-2"
        onClick={() => console.log(`Wicket fallen: ${selectedBatsman}`)}
      >
        Confirm Wicket
      </button>
    </div>
  );
}
