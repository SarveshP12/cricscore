"use client";
import { useState } from "react";
import { db } from "@/lib/firebase"; // Import db from your Firebase config
import { ref, push, update } from "firebase/database"; // Import ref, push, update from firebase/database

const WICKET_TYPES = ["Bowled", "Caught", "LBW", "Run Out", "Stumped"];

export const WicketSelector = ({ matchId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const recordWicket = async (type) => {
    if (!matchId) return;

    const historyRef = ref(db, `matches/${matchId}/ballHistory`);
    const newWicketRef = push(historyRef); // Generate a unique key

    await update(newWicketRef, {
      wicket: type,
      timestamp: Date.now(),
    });

    setIsOpen(false);
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-red-500 text-white rounded"
      >
        Add Wicket
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg grid grid-cols-2 gap-2">
            {WICKET_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => recordWicket(type)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
