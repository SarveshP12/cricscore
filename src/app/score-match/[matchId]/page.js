"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { firestoreDB, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, onValue, push, set, get, update } from "firebase/database";
import ScoreDisplay from "@/components/ScoreDisplay";
import BallHistory from "@/components/BallHistory";
import PlayerSelector from "@/components/PlayerSelector";
import ScoreControls from "@/components/ScoreControls";
import WicketSelector from "@/components/WicketSelector";
import InningsControls from "@/components/InningsControls";
import BatsmanStats from "@/components/BatsmanStats";
import BowlerStats from "@/components/BowlerStats";

const safeNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

const defaultExtras = {
  wides: 0,
  noballs: 0,
  byes: 0,
  legbyes: 0,
  penalty: 0
};

export default function ScorerDashboard() {
  const { matchId } = useParams();
  const router = useRouter();
  const [match, setMatch] = useState(null);
  const [currentInnings, setCurrentInnings] = useState(1);
  const [batsmen, setBatsmen] = useState({ striker: null, nonStriker: null });
  const [bowler, setBowler] = useState(null);
  const [lastBowler, setLastBowler] = useState(null);
  const [matchStatus, setMatchStatus] = useState("not_started");
  const [totalBalls, setTotalBalls] = useState(0);
  const [score, setScore] = useState({
    runs: 0,
    wickets: 0,
    extras: { ...defaultExtras },
    overs: 0,
    balls: 0
  });
  const [balls, setBalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [freeHit, setFreeHit] = useState(false);
  const [lastBall, setLastBall] = useState(null);

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

    const unsubscribeInnings = onValue(ref(db, `matches/${matchId}/currentInnings`), (snapshot) => {
      setCurrentInnings(safeNumber(snapshot.val(), 1));
    });

    const unsubscribeStatus = onValue(ref(db, `matches/${matchId}/status`), (snapshot) => {
      setMatchStatus(snapshot.val() || "not_started");
    });

    const unsubscribeBalls = onValue(ref(db, `matches/${matchId}/currentBall`), (snapshot) => {
      setTotalBalls(safeNumber(snapshot.val()));
    });

    const unsubscribeScore = onValue(ref(db, `matches/${matchId}/innings/${currentInnings}/score`), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setScore({
          runs: safeNumber(data.runs),
          wickets: safeNumber(data.wickets),
          extras: data.extras || { ...defaultExtras },
          overs: Math.floor(safeNumber(data.balls) / 6),
          balls: safeNumber(data.balls) % 6
        });
      }
      setIsLoading(false);
    });

    const unsubscribeBallsHistory = onValue(ref(db, `matches/${matchId}/innings/${currentInnings}/balls`), (snapshot) => {
      if (snapshot.exists()) {
        const ballsData = snapshot.val();
        const ballsArray = Object.entries(ballsData)
          .map(([id, ball]) => ({ id, ...ball }))
          .sort((a, b) => safeNumber(a.timestamp) - safeNumber(b.timestamp));
        setBalls(ballsArray);
      } else {
        setBalls([]);
      }
    });

    const unsubscribeLastBall = onValue(ref(db, `matches/${matchId}/innings/${currentInnings}/lastBall`), (snapshot) => {
      if (snapshot.exists()) {
        const ball = snapshot.val();
        setLastBall(ball);
        setFreeHit(ball?.extras?.noball ? true : false);
      } else {
        setLastBall(null);
        setFreeHit(false);
      }
    });

    fetchMatch();

    return () => {
      unsubscribeInnings();
      unsubscribeStatus();
      unsubscribeBalls();
      unsubscribeScore();
      unsubscribeBallsHistory();
      unsubscribeLastBall();
    };
  }, [matchId, currentInnings]);

  const overProgress = `${score.overs}.${score.balls}`;

  const recordBall = async (ballData) => {
    if (!batsmen.striker || !batsmen.nonStriker || !bowler) {
      alert("Please select both batsmen and bowler before recording a ball");
      return false;
    }

    try {
      const inningsPath = `matches/${matchId}/innings/${currentInnings}`;
      const newBallRef = push(ref(db, `${inningsPath}/balls`));
      
      const completeBallData = {
        ...ballData,
        batsman: batsmen.striker,
        nonStriker: batsmen.nonStriker,
        bowler: bowler,
        timestamp: Date.now(),
        over: safeNumber(score.overs),
        ball: safeNumber(score.balls) + 1,
        isFreeHit: freeHit,
        runs: safeNumber(ballData.runs, 0),
        extras: {
          wides: safeNumber(ballData.extras?.wide, 0),
          noballs: safeNumber(ballData.extras?.noball, 0),
          byes: safeNumber(ballData.extras?.byes, 0),
          legbyes: safeNumber(ballData.extras?.legbyes, 0),
          penalty: safeNumber(ballData.extras?.penalty, 0),
        },
        wicket: ballData.wicket || null
      };

      await set(newBallRef, completeBallData);
      await set(ref(db, `${inningsPath}/lastBall`), completeBallData);
      await updatePlayerStats(completeBallData);
      
      return true;
    } catch (error) {
      console.error("Error recording ball:", error);
      return false;
    }
  };

  const updatePlayerStats = async (ballData) => {
    const inningsPath = `matches/${matchId}/innings/${currentInnings}/playerStats`;
    
    // Update batsman stats
    if (ballData.batsman) {
      const batsmanRef = ref(db, `${inningsPath}/${ballData.batsman.id}`);
      const batsmanSnap = await get(batsmanRef);
      const currentStats = batsmanSnap.exists() ? batsmanSnap.val() : {
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        status: 'batting'
      };

      let updates = {};
      
      if (!ballData.wicket) {
        updates.runs = safeNumber(currentStats.runs, 0) + safeNumber(ballData.runs, 0);
        updates.balls = safeNumber(currentStats.balls, 0) + 1;
        
        if (ballData.runs === 4) updates.fours = safeNumber(currentStats.fours, 0) + 1;
        if (ballData.runs === 6) updates.sixes = safeNumber(currentStats.sixes, 0) + 1;
      } else {
        updates.status = `out (${ballData.wicket.type})`;
      }

      await update(batsmanRef, updates);
    }

    // Update bowler stats
    if (ballData.bowler) {
      const bowlerRef = ref(db, `${inningsPath}/${ballData.bowler.id}`);
      const bowlerSnap = await get(bowlerRef);
      const currentStats = bowlerSnap.exists() ? bowlerSnap.val() : {
        balls: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        wides: 0,
        noballs: 0
      };

      let updates = {
        balls: safeNumber(currentStats.balls, 0) + (ballData.extras?.wide || ballData.extras?.noball ? 0 : 1),
        runs: safeNumber(currentStats.runs, 0) + 
              safeNumber(ballData.runs, 0) + 
              safeNumber(ballData.extras?.wide, 0) + 
              safeNumber(ballData.extras?.noball, 0)
      };

      if (ballData.wicket && ['bowled', 'caught', 'lbw', 'stumped', 'hitwicket'].includes(ballData.wicket.type)) {
        updates.wickets = safeNumber(currentStats.wickets, 0) + 1;
      }

      if (ballData.extras?.wide) {
        updates.wides = safeNumber(currentStats.wides, 0) + 1;
      }

      if (ballData.extras?.noball) {
        updates.noballs = safeNumber(currentStats.noballs, 0) + 1;
      }

      await update(bowlerRef, updates);
    }
  };

  const handleScoreUpdate = async (runs, extras = {}) => {
    if (!batsmen.striker || !batsmen.nonStriker || !bowler) {
      alert("Please select both batsmen and bowler before scoring");
      return;
    }

    const runsValue = safeNumber(runs, 0);
    const extrasValue = {
      wide: safeNumber(extras.wide, 0),
      noball: safeNumber(extras.noball, 0),
      byes: safeNumber(extras.byes, 0),
      legbyes: safeNumber(extras.legbyes, 0),
      penalty: safeNumber(extras.penalty, 0)
    };

    const isExtraBall = extrasValue.wide > 0 || extrasValue.noball > 0;
    const runsToAdd = safeNumber(
      runsValue + 
      extrasValue.wide + 
      extrasValue.noball + 
      extrasValue.byes + 
      extrasValue.legbyes + 
      extrasValue.penalty,
      0
    );
    
    await recordBall({
      runs: runsValue,
      extras: extrasValue,
      wicket: null,
    });
    
    const teamPath = currentInnings === 1 ? "teamA" : "teamB";
    const scoreRef = ref(db, `matches/${matchId}/score/${teamPath}`);
    const snapshot = await get(scoreRef);
    const currentScore = snapshot.exists() ? snapshot.val() : { runs: 0, wickets: 0, balls: 0 };
    
    await set(scoreRef, {
      runs: safeNumber(currentScore.runs, 0) + runsToAdd,
      wickets: safeNumber(currentScore.wickets, 0),
      balls: safeNumber(currentScore.balls, 0) + (isExtraBall ? 0 : 1),
    });

    const inningsPath = `matches/${matchId}/innings/${currentInnings}/score`;
    const inningsSnapshot = await get(ref(db, inningsPath));
    const inningsScore = inningsSnapshot.exists() ? inningsSnapshot.val() : { 
      runs: 0, 
      wickets: 0, 
      balls: 0,
      extras: { ...defaultExtras }
    };
    
    await set(ref(db, inningsPath), {
      runs: safeNumber(inningsScore.runs, 0) + runsToAdd,
      wickets: safeNumber(inningsScore.wickets, 0),
      balls: safeNumber(inningsScore.balls, 0) + (isExtraBall ? 0 : 1),
      extras: {
        wides: safeNumber(inningsScore.extras?.wides, 0) + extrasValue.wide,
        noballs: safeNumber(inningsScore.extras?.noballs, 0) + extrasValue.noball,
        byes: safeNumber(inningsScore.extras?.byes, 0) + extrasValue.byes,
        legbyes: safeNumber(inningsScore.extras?.legbyes, 0) + extrasValue.legbyes,
        penalty: safeNumber(inningsScore.extras?.penalty, 0) + extrasValue.penalty,
      }
    });

    if (!isExtraBall) {
      await set(ref(db, `matches/${matchId}/currentBall`), safeNumber(totalBalls, 0) + 1);
    }

    if (extrasValue.noball > 0) {
      setFreeHit(true);
    } else if (!isExtraBall) {
      setFreeHit(false);
    }

    if (runsValue % 2 !== 0 && (safeNumber(score.balls) + 1) % 6 !== 0) {
      setBatsmen(prev => ({
        striker: prev.nonStriker,
        nonStriker: prev.striker
      }));
    }
  };

  const handleWicket = async (wicketData) => {
    if (!batsmen.striker || !batsmen.nonStriker || !bowler) {
      alert("Please select both batsmen and bowler before recording a wicket");
      return;
    }

    if (freeHit && wicketData.type !== 'runout') {
      alert("Cannot be dismissed on a free hit (except run out)");
      return;
    }

    const runsValue = safeNumber(wicketData.runs, 0);
    const extrasValue = wicketData.extras ? {
      wide: safeNumber(wicketData.extras.wide, 0),
      noball: safeNumber(wicketData.extras.noball, 0),
      byes: safeNumber(wicketData.extras.byes, 0),
      legbyes: safeNumber(wicketData.extras.legbyes, 0),
      penalty: safeNumber(wicketData.extras.penalty, 0)
    } : { ...defaultExtras };

    const isExtraBall = extrasValue.wide > 0 || extrasValue.noball > 0;
    const runsToAdd = safeNumber(
      runsValue + 
      extrasValue.wide + 
      extrasValue.noball + 
      extrasValue.byes + 
      extrasValue.legbyes + 
      extrasValue.penalty,
      0
    );

    try {
      const success = await recordBall({
        runs: runsValue,
        extras: extrasValue,
        wicket: {
          type: wicketData.type,
          batsman: batsmen.striker,
          ...(wicketData.fielder && { fielder: wicketData.fielder })
        },
      });

      if (!success) return;

      const teamPath = currentInnings === 1 ? "teamA" : "teamB";
      const scoreRef = ref(db, `matches/${matchId}/score/${teamPath}`);
      const snapshot = await get(scoreRef);
      const currentScore = snapshot.exists() ? snapshot.val() : { runs: 0, wickets: 0, balls: 0 };
      
      await set(scoreRef, {
        runs: safeNumber(currentScore.runs, 0) + runsToAdd,
        wickets: safeNumber(currentScore.wickets, 0) + 1,
        balls: safeNumber(currentScore.balls, 0) + (isExtraBall ? 0 : 1),
      });

      const inningsPath = `matches/${matchId}/innings/${currentInnings}/score`;
      const inningsSnapshot = await get(ref(db, inningsPath));
      const inningsScore = inningsSnapshot.exists() ? inningsSnapshot.val() : { 
        runs: 0, 
        wickets: 0, 
        balls: 0,
        extras: { ...defaultExtras }
      };
      
      await set(ref(db, inningsPath), {
        runs: safeNumber(inningsScore.runs, 0) + runsToAdd,
        wickets: safeNumber(inningsScore.wickets, 0) + 1,
        balls: safeNumber(inningsScore.balls, 0) + (isExtraBall ? 0 : 1),
        extras: {
          wides: safeNumber(inningsScore.extras?.wides, 0) + extrasValue.wide,
          noballs: safeNumber(inningsScore.extras?.noballs, 0) + extrasValue.noball,
          byes: safeNumber(inningsScore.extras?.byes, 0) + extrasValue.byes,
          legbyes: safeNumber(inningsScore.extras?.legbyes, 0) + extrasValue.legbyes,
          penalty: safeNumber(inningsScore.extras?.penalty, 0) + extrasValue.penalty,
        }
      });

      if (!isExtraBall) {
        await set(ref(db, `matches/${matchId}/currentBall`), safeNumber(totalBalls, 0) + 1);
      }

      const newBatsman = prompt("Enter name of new batsman coming in:");
      if (newBatsman) {
        const newBatsmanData = { id: Date.now().toString(), name: newBatsman };
        setBatsmen(prev => ({
          ...prev,
          striker: newBatsmanData
        }));
        
        const newBatsmanRef = ref(db, `matches/${matchId}/innings/${currentInnings}/playerStats/${newBatsmanData.id}`);
        await set(newBatsmanRef, {
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          status: 'batting'
        });
      } else {
        setBatsmen(prev => ({
          ...prev,
          striker: null
        }));
      }

    } catch (error) {
      console.error("Error handling wicket:", error);
      alert("Failed to record wicket. Please check console for details.");
    }
  };

  const handleOverComplete = async () => {
    if (!batsmen.striker || !batsmen.nonStriker) {
      alert("Please select both batsmen before completing the over");
      return;
    }

    setBatsmen(prev => ({
      striker: prev.nonStriker,
      nonStriker: prev.striker
    }));

    setLastBowler(bowler);
    setBowler(null);

    alert("Please select a new bowler for the next over");
  };

  const startMatch = async () => {
    await set(ref(db, `matches/${matchId}/status`), "in_progress");
    await set(ref(db, `matches/${matchId}/currentInnings`), 1);
    await set(ref(db, `matches/${matchId}/currentBall`), 0);
    
    await set(ref(db, `matches/${matchId}/innings/1`), {
      startedAt: Date.now(),
      status: "in_progress",
      battingTeam: "teamA",
      bowlingTeam: "teamB",
      score: {
        runs: 0,
        wickets: 0,
        balls: 0,
        extras: { ...defaultExtras }
      },
      balls: {},
      playerStats: {},
      currentBatsmen: {
        striker: null,
        nonStriker: null
      },
      currentBowler: null
    });
    
    await set(ref(db, `matches/${matchId}/score`), {
      teamA: { runs: 0, wickets: 0, balls: 0 },
      teamB: { runs: 0, wickets: 0, balls: 0 }
    });

    const matchRef = doc(firestoreDB, "matches", matchId);
    await updateDoc(matchRef, {
      status: "in_progress",
      startTime: new Date().toISOString()
    });
  };

  const endInnings = async () => {
    await set(ref(db, `matches/${matchId}/innings/${currentInnings}/status`), "completed");
    
    if (currentInnings === 1) {
      await set(ref(db, `matches/${matchId}/currentInnings`), 2);
      await set(ref(db, `matches/${matchId}/currentBall`), 0);
      
      await set(ref(db, `matches/${matchId}/innings/2`), {
        startedAt: Date.now(),
        status: "in_progress",
        battingTeam: "teamB",
        bowlingTeam: "teamA",
        score: {
          runs: 0,
          wickets: 0,
          balls: 0,
          extras: { ...defaultExtras }
        },
        balls: {},
        playerStats: {},
        currentBatsmen: {
          striker: null,
          nonStriker: null
        },
        currentBowler: null
      });
    } else {
      await set(ref(db, `matches/${matchId}/status`), "completed");
      
      const matchRef = doc(firestoreDB, "matches", matchId);
      await updateDoc(matchRef, {
        status: "completed",
        endTime: new Date().toISOString()
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <button
        onClick={() => router.back()}
        className="text-blue-500 mb-4 flex items-center hover:text-blue-700"
      >
        ← Back to Matches
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {match?.teamA} vs {match?.teamB} - Scorer Dashboard
      </h1>

      <div className="mb-4 bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center">
          <div>
            <p>Current Over: {overProgress}</p>
            <p>Match Status: 
              <span className={`font-bold ${
                matchStatus === "in_progress" ? "text-green-500" : 
                matchStatus === "completed" ? "text-red-500" : "text-gray-500"
              }`}>
                {matchStatus === "not_started" ? "Not Started" : 
                 matchStatus === "in_progress" ? "In Progress" : "Completed"}
              </span>
            </p>
          </div>
          {freeHit && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded">
              FREE HIT ACTIVE
            </div>
          )}
        </div>
      </div>

      {matchStatus === "not_started" && (
        <button
          onClick={startMatch}
          className="bg-green-500 text-white px-4 py-2 rounded mb-6 hover:bg-green-600"
        >
          Start Match
        </button>
      )}

      {matchStatus === "in_progress" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <ScoreDisplay 
              score={score} 
              overProgress={overProgress} 
              batsmen={batsmen} 
              bowler={bowler} 
              freeHit={freeHit}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PlayerSelector
                team={currentInnings === 1 ? "A" : "B"}
                role="Striker"
                onSelect={(player) =>
                  setBatsmen((prev) => ({ ...prev, striker: player }))
                }
                lastBowler={null}
                matchId={matchId}
              />
              <PlayerSelector
                team={currentInnings === 1 ? "A" : "B"}
                role="Non-Striker"
                onSelect={(player) =>
                  setBatsmen((prev) => ({ ...prev, nonStriker: player }))
                }
                lastBowler={null}
                matchId={matchId}
              />
            </div>

            <PlayerSelector
              team={currentInnings === 1 ? "B" : "A"}
              role="Bowler"
              onSelect={setBowler}
              lastBowler={lastBowler}
              matchId={matchId}
            />

            <ScoreControls 
              onScoreUpdate={handleScoreUpdate} 
              batsmen={batsmen} 
              bowler={bowler}
            />
            <WicketSelector 
              onWicket={handleWicket} 
              batsmen={batsmen} 
              bowler={bowler}
              freeHit={freeHit}
            />
          </div>

          <div className="space-y-6">
            <InningsControls 
              matchStatus={matchStatus}
              score={score}
              currentInnings={currentInnings}
              onOverComplete={handleOverComplete}
              onEndInnings={endInnings}
            />

            {batsmen.striker && (
              <BatsmanStats 
                batsman={batsmen.striker} 
                matchId={matchId} 
                currentInnings={currentInnings}
              />
            )}

            {bowler && (
              <BowlerStats 
                bowler={bowler} 
                matchId={matchId} 
                currentInnings={currentInnings}
              />
            )}

            <BallHistory balls={balls} />
          </div>
        </div>
      )}

      {matchStatus === "completed" && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Match Completed</h2>
          <p>Final Score:</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border p-4 rounded">
              <h3 className="font-bold">{match?.teamA}</h3>
              <p>{score.runs}/{score.wickets} ({overProgress} overs)</p>
            </div>
            <div className="border p-4 rounded">
              <h3 className="font-bold">{match?.teamB}</h3>
              <p>{score.runs}/{score.wickets} ({overProgress} overs)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}