"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { firestoreDB, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import ScoreDisplay from "@/components/ScoreDisplay";
import ScoreControls from "@/components/ScoreControls";
import PlayerSelector from "@/components/PlayerSelector"; // ✅ Ensure correct import
import WicketSelector from "@/components/WicketSelector";
import BowlerStats from "@/components/BowlerStats";
import BatsmanStats from "@/components/BatsmanStats";
import InningsSwitcher from "@/components/InningsSwitcher";
import BallHistory from "@/components/BallHistory";

export default function ScorerDashboard() {
  const { matchId } = useParams();
  const router = useRouter();
  const [match, setMatch] = useState(null);
  const [currentInnings, setCurrentInnings] = useState(1);
  const [batsmen, setBatsmen] = useState({ striker: "", nonStriker: "" });
  const [bowler, setBowler] = useState("");

  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = async () => {
      try {
        const matchRef = doc(firestoreDB, "matches", matchId);
        const matchSnap = await getDoc(matchRef);
        if (matchSnap.exists()) {
          setMatch(matchSnap.data());
        }
      } catch (error) {
        console.error("Error fetching match:", error);
      }
    };

    const inningsRef = ref(db, `matches/${matchId}/currentInnings`);
    onValue(inningsRef, (snapshot) => {
      setCurrentInnings(snapshot.val() || 1);
    });

    fetchMatch();
  }, [matchId]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <button
        onClick={() => router.back()}
        className="text-blue-500 mb-4 flex items-center"
      >
        ← Back to Matches
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {match?.teamA} vs {match?.teamB} - Scorer Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <ScoreDisplay matchId={matchId} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <PlayerSelector
                matchId={matchId}
                team={currentInnings === 1 ? "A" : "B"}
                role="Striker"
                onSelect={(player) =>
                  setBatsmen((prev) => ({ ...prev, striker: player }))
                }
              />
            </div>
            <div>
              <PlayerSelector
                matchId={matchId}
                team={currentInnings === 1 ? "A" : "B"}
                role="Non-Striker"
                onSelect={(player) =>
                  setBatsmen((prev) => ({ ...prev, nonStriker: player }))
                }
              />
            </div>
          </div>

          <PlayerSelector
            matchId={matchId}
            team={currentInnings === 1 ? "B" : "A"}
            role="Bowler"
            onSelect={setBowler}
          />

          <ScoreControls matchId={matchId} />
          <WicketSelector matchId={matchId} />
        </div>

        <div className="space-y-4">
          <InningsSwitcher matchId={matchId} currentInnings={currentInnings} />

          {batsmen.striker && (
            <BatsmanStats matchId={matchId} batsmanId={batsmen.striker} />
          )}

          {bowler && <BowlerStats matchId={matchId} bowlerId={bowler} />}

          <BallHistory matchId={matchId} />
        </div>
      </div>
    </div>
  );
}
