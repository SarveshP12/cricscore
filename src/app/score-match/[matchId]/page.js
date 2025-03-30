"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { firestoreDB, db, realtime } from "@/lib/firebase"; // Ensure Firebase Realtime DB is imported
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, onValue, update, push } from "firebase/database";

export default function MatchPage() {
  const params = useParams(); // Use useParams() to access matchId
  const matchId = params.matchId; // Extract matchId properly
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState({ runs: 0, wickets: 0, overs: 0 });
  const [newRun, setNewRun] = useState("");
  const router = useRouter();

  // Fetch match details from Firestore
  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) return;

      const matchRef = doc(firestoreDB, "matches", matchId);
      const matchSnap = await getDoc(matchRef);

      if (matchSnap.exists()) {
        setMatch(matchSnap.data());
      } else {
        console.error("Match not found!");
      }
    };

    fetchMatch();
  }, [matchId]);

  // Listen for real-time score updates
  useEffect(() => {
    if (!matchId) return;

    const scoreRef = ref(db, `matches/${matchId}/score`);
    return onValue(scoreRef, (snapshot) => {
      setScore(snapshot.val() || { runs: 0, wickets: 0, overs: 0 });
    });
  }, [matchId]);

  // Function to update the score in real-time & Firestore
  const updateScore = async (runs) => {
    if (!matchId) return;

    const newRuns = score.runs + runs;
    const newOvers = score.overs + 0.1; // Increment overs

    // ✅ Update Realtime Database
    const scoreRef = ref(db, `matches/${matchId}/score`);
    update(scoreRef, {
      runs: newRuns,
      overs: newOvers,
    });

    // ✅ Store ball-by-ball data in Realtime DB
    const ballHistoryRef = ref(db, `matches/${matchId}/ballHistory`);
    push(ballHistoryRef, { runs, timestamp: Date.now() });

    // ✅ Also update Firestore
    const matchDocRef = doc(firestoreDB, "matches", matchId);
    try {
      await updateDoc(matchDocRef, {
        "score.runs": newRuns,
        "score.overs": newOvers,
      });
    } catch (error) {
      console.error("Error updating Firestore:", error);
    }

    setNewRun(""); // Reset input field
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={() => router.back()} className="text-blue-500">⬅ Back</button>
      <h2 className="text-3xl font-bold mt-4">{match?.team1} vs {match?.team2}</h2>

      {/* Live Score Display */}
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="text-xl font-semibold">🏏 Live Score</h3>
        <p className="text-lg">Runs: {score.runs} | Wickets: {score.wickets} | Overs: {score.overs.toFixed(1)}</p>
      </div>

      {/* Input for ball-by-ball scoring */}
      <div className="mt-4">
        <input
          type="number"
          value={newRun}
          onChange={(e) => setNewRun(parseInt(e.target.value, 10) || "")}
          className="border px-2 py-1 mr-2"
          placeholder="Enter runs"
        />
        <button
          onClick={() => updateScore(Number(newRun))}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          Add Score
        </button>
      </div>
    </div>
  );
}
