"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { firestoreDB, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, onValue, push, set, get } from "firebase/database";
import ScoreDisplay from "@/components/ScoreDisplay";
import ScoreControls from "@/components/ScoreControls";
import PlayerSelector from "@/components/PlayerSelector";
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
  const [matchStatus, setMatchStatus] = useState("not_started");
  const [currentOver, setCurrentOver] = useState(0);
  const [currentBall, setCurrentBall] = useState(0);

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

    const statusRef = ref(db, `matches/${matchId}/status`);
    onValue(statusRef, (snapshot) => {
      setMatchStatus(snapshot.val() || "not_started");
    });

    const overRef = ref(db, `matches/${matchId}/currentOver`);
    onValue(overRef, (snapshot) => {
      setCurrentOver(snapshot.val() || 0);
    });

    const ballRef = ref(db, `matches/${matchId}/currentBall`);
    onValue(ballRef, (snapshot) => {
      setCurrentBall(snapshot.val() || 0);
    });

    fetchMatch();
  }, [matchId]);

  const recordBall = async (ballData) => {
    try {
      const inningsPath = `matches/${matchId}/innings/${currentInnings}`;
      const ballsRef = ref(db, `${inningsPath}/balls`);
      const newBallRef = push(ballsRef);
      
      // Get current ball count
      const snapshot = await get(ballsRef);
      const ballCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
      const over = Math.floor(ballCount / 6);
      const ballInOver = (ballCount % 6) + 1;
      
      const completeBallData = {
        ...ballData,
        batsman: batsmen.striker,
        nonStriker: batsmen.nonStriker,
        bowler: bowler,
        timestamp: Date.now(),
        ballNumber: `${over}.${ballInOver}`,
      };

      await set(newBallRef, completeBallData);
      
      // Update match summary and current ball count
      await set(ref(db, `${inningsPath}/lastBall`), completeBallData);
      await set(ref(db, `matches/${matchId}/currentBall`), ballCount + 1);
      
      // Update over count if needed
      if ((ballCount + 1) % 6 === 0) {
        await set(ref(db, `matches/${matchId}/currentOver`), over + 1);
      }
      
      return true;
    } catch (error) {
      console.error("Error recording ball:", error);
      return false;
    }
  };

  const handleScoreUpdate = async (runs, extras = {}) => {
    await recordBall({
      runs,
      extras,
      wicket: null,
    });
    
    // Update team score in realtime database
    const teamPath = currentInnings === 1 ? "teamA" : "teamB";
    const scoreRef = ref(db, `matches/${matchId}/score/${teamPath}`);
    const snapshot = await get(scoreRef);
    const currentScore = snapshot.exists() ? snapshot.val() : { runs: 0, wickets: 0, balls: 0 };
    
    await set(scoreRef, {
      ...currentScore,
      runs: currentScore.runs + runs,
      balls: currentScore.balls + 1,
    });
  };

  const handleWicket = async (wicketData) => {
    await recordBall({
      runs: wicketData.runs || 0,
      extras: wicketData.extras || {},
      wicket: {
        type: wicketData.type,
        batsman: batsmen.striker,
      },
    });
    
    // Update team score in realtime database
    const teamPath = currentInnings === 1 ? "teamA" : "teamB";
    const scoreRef = ref(db, `matches/${matchId}/score/${teamPath}`);
    const snapshot = await get(scoreRef);
    const currentScore = snapshot.exists() ? snapshot.val() : { runs: 0, wickets: 0, balls: 0 };
    
    await set(scoreRef, {
      ...currentScore,
      runs: currentScore.runs + (wicketData.runs || 0),
      wickets: currentScore.wickets + 1,
      balls: currentScore.balls + 1,
    });
  };

  const startMatch = async () => {
    await set(ref(db, `matches/${matchId}/status`), "in_progress");
    await set(ref(db, `matches/${matchId}/currentInnings`), 1);
    await set(ref(db, `matches/${matchId}/currentOver`), 0);
    await set(ref(db, `matches/${matchId}/currentBall`), 0);
    
    // Initialize innings structure
    await set(ref(db, `matches/${matchId}/innings/1`), {
      startedAt: Date.now(),
      status: "in_progress",
      battingTeam: "teamA",
      bowlingTeam: "teamB",
      score: 0,
      wickets: 0,
      overs: 0,
      balls: [],
      currentBatsmen: {
        striker: null,
        nonStriker: null
      },
      currentBowler: null
    });
    
    // Initialize score
    await set(ref(db, `matches/${matchId}/score`), {
      teamA: { runs: 0, wickets: 0, balls: 0 },
      teamB: { runs: 0, wickets: 0, balls: 0 }
    });
  };

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

      <div className="mb-4">
        <p>Current Over: {currentOver}.{currentBall}</p>
        <p>Match Status: {matchStatus}</p>
      </div>

      {matchStatus === "not_started" && (
        <button
          onClick={startMatch}
          className="bg-green-500 text-white px-4 py-2 rounded mb-6"
        >
          Start Match
        </button>
      )}

      {matchStatus === "in_progress" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <ScoreDisplay matchId={matchId} currentInnings={currentInnings} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PlayerSelector
                matchId={matchId}
                team={currentInnings === 1 ? "A" : "B"}
                role="Striker"
                onSelect={(player) =>
                  setBatsmen((prev) => ({ ...prev, striker: player }))
                }
              />
              <PlayerSelector
                matchId={matchId}
                team={currentInnings === 1 ? "A" : "B"}
                role="Non-Striker"
                onSelect={(player) =>
                  setBatsmen((prev) => ({ ...prev, nonStriker: player }))
                }
              />
            </div>

            <PlayerSelector
              matchId={matchId}
              team={currentInnings === 1 ? "B" : "A"}
              role="Bowler"
              onSelect={setBowler}
            />

            <ScoreControls onScoreUpdate={handleScoreUpdate} />
            <WicketSelector onWicket={handleWicket} />
          </div>

          <div className="space-y-4">
            <InningsSwitcher matchId={matchId} currentInnings={currentInnings} />

            {batsmen.striker && (
              <BatsmanStats 
                matchId={matchId} 
                batsmanId={batsmen.striker} 
                inningsNumber={currentInnings}
              />
            )}

            {bowler && (
              <BowlerStats 
                matchId={matchId} 
                bowlerId={bowler} 
                inningsNumber={currentInnings}
              />
            )}

            <BallHistory matchId={matchId} inningsNumber={currentInnings} />
          </div>
        </div>
      )}
    </div>
  );
}