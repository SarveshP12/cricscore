"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { firestoreDB, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, onValue, push, update, get } from "firebase/database";
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
  
  const [gameState, setGameState] = useState({
    match: null,
    currentInnings: 1,
    batsmen: { striker: null, nonStriker: null },
    bowler: null,
    lastBowler: null,
    matchStatus: "not_started",
    totalBalls: 0,
    score: { 
      runs: 0, 
      wickets: 0, 
      extras: { ...defaultExtras }, 
      overs: 0, 
      balls: 0 
    },
    balls: [],
    freeHit: false,
    lastBall: null,
    isLoading: true
  });

  const overProgress = useMemo(() => 
    `${gameState.score.overs}.${gameState.score.balls}`,
    [gameState.score.overs, gameState.score.balls]
  );

  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = async () => {
      try {
        const matchRef = doc(firestoreDB, "matches", matchId);
        const matchSnap = await getDoc(matchRef);
        if (matchSnap.exists()) {
          setGameState(prev => ({ ...prev, match: matchSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching match:", error);
      }
    };

    const unsubscribe = onValue(ref(db, `matches/${matchId}`), (snapshot) => {
      if (!snapshot.exists()) {
        setGameState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const data = snapshot.val();
      const currentInnings = safeNumber(data.currentInnings, 1);
      const inningsData = data.innings?.[currentInnings] || {};
      const scoreData = inningsData.score || {};
      const ballsData = inningsData.balls || {};

      setGameState(prev => ({
        ...prev,
        currentInnings,
        matchStatus: data.status || "not_started",
        totalBalls: safeNumber(data.currentBall, 0),
        score: {
          runs: safeNumber(scoreData.runs),
          wickets: safeNumber(scoreData.wickets),
          extras: scoreData.extras || { ...defaultExtras },
          overs: Math.floor(safeNumber(scoreData.balls) / 6),
          balls: safeNumber(scoreData.balls) % 6
        },
        balls: Object.values(ballsData).sort((a, b) => safeNumber(a.timestamp) - safeNumber(b.timestamp)),
        lastBall: inningsData.lastBall || null,
        freeHit: inningsData.lastBall?.extras?.noball ? true : false,
        isLoading: false
      }));
    });

    fetchMatch();
    return () => unsubscribe();
  }, [matchId]);

  const updatePlayerStats = useCallback(async (ballData) => {
    const { currentInnings } = gameState;
    const inningsPath = `matches/${matchId}/playerStats/${currentInnings}/playerStats`;
    
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

      const updates = {};
      
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

      const updates = {
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
  }, [gameState.currentInnings, matchId]);

  const recordBall = useCallback(async (ballData) => {
    const { batsmen, bowler, freeHit, score, currentInnings } = gameState;
    
    if (!batsmen.striker || !batsmen.nonStriker || !bowler) {
      alert("Please select both batsmen and bowler before recording a ball");
      return false;
    }

    try {
      const inningsPath = `matches/${matchId}/innings/${currentInnings}`;
      const newBallId = push(ref(db, `${inningsPath}/balls`)).key;

      const completeBallData = {
        ...ballData,
        batsman: batsmen.striker,
        nonStriker: batsmen.nonStriker,
        bowler,
        timestamp: Date.now(),
        over: safeNumber(score.overs),
        ball: safeNumber(score.balls) + 1,
        isFreeHit: freeHit,
        extras: ballData.extras || {},
        wicket: ballData.wicket || null
      };

      const updates = {
        [`${inningsPath}/balls/${newBallId}`]: completeBallData,
        [`${inningsPath}/lastBall`]: completeBallData
      };

      await update(ref(db), updates);
      await updatePlayerStats(completeBallData);
      
      return true;
    } catch (error) {
      console.error("Error recording ball:", error);
      return false;
    }
  }, [gameState, matchId, updatePlayerStats]);

  const handleScoreUpdate = useCallback(async (runs, extras = {}) => {
    const { batsmen, bowler, currentInnings, totalBalls, score } = gameState;
    
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
    
    const updates = {
      [`matches/${matchId}/currentBall`]: isExtraBall ? totalBalls : totalBalls + 1,
      [`matches/${matchId}/innings/${currentInnings}/score/runs`]: safeNumber(score.runs) + runsToAdd,
      [`matches/${matchId}/innings/${currentInnings}/score/extras/wides`]: safeNumber(score.extras.wides) + extrasValue.wide,
      [`matches/${matchId}/innings/${currentInnings}/score/extras/noballs`]: safeNumber(score.extras.noballs) + extrasValue.noball,
      [`matches/${matchId}/innings/${currentInnings}/score/extras/byes`]: safeNumber(score.extras.byes) + extrasValue.byes,
      [`matches/${matchId}/innings/${currentInnings}/score/extras/legbyes`]: safeNumber(score.extras.legbyes) + extrasValue.legbyes,
      [`matches/${matchId}/innings/${currentInnings}/score/extras/penalty`]: safeNumber(score.extras.penalty) + extrasValue.penalty,
      [`matches/${matchId}/innings/${currentInnings}/score/balls`]: isExtraBall ? safeNumber(score.balls) : safeNumber(score.balls) + 1
    };

    await update(ref(db), updates);
    await recordBall({
      runs: runsValue,
      extras: extrasValue,
      wicket: null,
    });

    setGameState(prev => ({
      ...prev,
      freeHit: extrasValue.noball > 0 ? true : !isExtraBall ? false : prev.freeHit,
      batsmen: (runsValue % 2 !== 0 && (safeNumber(score.balls) + 1) % 6 !== 0) ? {
        striker: prev.batsmen.nonStriker,
        nonStriker: prev.batsmen.striker
      } : prev.batsmen
    }));
  }, [gameState, matchId, recordBall]);

  const handleWicket = useCallback(async (wicketData) => {
    const { batsmen, bowler, freeHit, currentInnings, totalBalls, score } = gameState;
    
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

      const updates = {
        [`matches/${matchId}/currentBall`]: isExtraBall ? totalBalls : totalBalls + 1,
        [`matches/${matchId}/innings/${currentInnings}/score/runs`]: safeNumber(score.runs) + runsToAdd,
        [`matches/${matchId}/innings/${currentInnings}/score/wickets`]: safeNumber(score.wickets) + 1,
        [`matches/${matchId}/innings/${currentInnings}/score/extras/wides`]: safeNumber(score.extras.wides) + extrasValue.wide,
        [`matches/${matchId}/innings/${currentInnings}/score/extras/noballs`]: safeNumber(score.extras.noballs) + extrasValue.noball,
        [`matches/${matchId}/innings/${currentInnings}/score/extras/byes`]: safeNumber(score.extras.byes) + extrasValue.byes,
        [`matches/${matchId}/innings/${currentInnings}/score/extras/legbyes`]: safeNumber(score.extras.legbyes) + extrasValue.legbyes,
        [`matches/${matchId}/innings/${currentInnings}/score/extras/penalty`]: safeNumber(score.extras.penalty) + extrasValue.penalty,
        [`matches/${matchId}/innings/${currentInnings}/score/balls`]: isExtraBall ? safeNumber(score.balls) : safeNumber(score.balls) + 1
      };

      await update(ref(db), updates);

      const newBatsman = prompt("Enter name of new batsman coming in:");
      if (newBatsman) {
        const newBatsmanData = { id: Date.now().toString(), name: newBatsman };
        
        await set(ref(db, `matches/${matchId}/innings/${currentInnings}/playerStats/${newBatsmanData.id}`), {
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          status: 'batting'
        });

        setGameState(prev => ({
          ...prev,
          batsmen: {
            ...prev.batsmen,
            striker: newBatsmanData
          }
        }));
      }
    } catch (error) {
      console.error("Error handling wicket:", error);
      alert("Failed to record wicket. Please check console for details.");
    }
  }, [gameState, matchId, recordBall]);

  const handleOverComplete = useCallback(async () => {
    const { batsmen, bowler } = gameState;
    
    if (!batsmen.striker || !batsmen.nonStriker) {
      alert("Please select both batsmen before completing the over");
      return;
    }

    setGameState(prev => ({
      ...prev,
      batsmen: {
        striker: prev.batsmen.nonStriker,
        nonStriker: prev.batsmen.striker
      },
      lastBowler: prev.bowler,
      bowler: null
    }));

    alert("Please select a new bowler for the next over");
  }, [gameState]);

  const startMatch = useCallback(async () => {
    const updates = {
      [`matches/${matchId}/status`]: "in_progress",
      [`matches/${matchId}/currentInnings`]: 1,
      [`matches/${matchId}/currentBall`]: 0,
      [`matches/${matchId}/innings/1`]: {
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
      },
      [`matches/${matchId}/score`]: {
        teamA: { runs: 0, wickets: 0, balls: 0 },
        teamB: { runs: 0, wickets: 0, balls: 0 }
      }
    };

    await update(ref(db), updates);

    const matchRef = doc(firestoreDB, "matches", matchId);
    await updateDoc(matchRef, {
      status: "in_progress",
      startTime: new Date().toISOString()
    });
  }, [matchId]);

  const endInnings = useCallback(async () => {
    const { currentInnings } = gameState;
    
    await set(ref(db, `matches/${matchId}/innings/${currentInnings}/status`), "completed");
    
    if (currentInnings === 1) {
      const updates = {
        [`matches/${matchId}/currentInnings`]: 2,
        [`matches/${matchId}/currentBall`]: 0,
        [`matches/${matchId}/innings/2`]: {
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
        }
      };
      
      await update(ref(db), updates);
    } else {
      await set(ref(db, `matches/${matchId}/status`), "completed");
      
      const matchRef = doc(firestoreDB, "matches", matchId);
      await updateDoc(matchRef, {
        status: "completed",
        endTime: new Date().toISOString()
      });
    }
  }, [gameState.currentInnings, matchId]);

  if (gameState.isLoading) {
    return <div className="max-w-6xl mx-auto p-4">Loading match data...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <button
        onClick={() => router.back()}
        className="text-blue-500 mb-4 flex items-center hover:text-blue-700"
      >
        ← Back to Matches
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {gameState.match?.teamA} vs {gameState.match?.teamB} - Scorer Dashboard
      </h1>

      <div className="mb-4 bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center">
          <div>
            <p>Current Over: {overProgress}</p>
            <p>Match Status: 
              <span className={`font-bold ${
                gameState.matchStatus === "in_progress" ? "text-green-500" : 
                gameState.matchStatus === "completed" ? "text-red-500" : "text-gray-500"
              }`}>
                {gameState.matchStatus === "not_started" ? "Not Started" : 
                 gameState.matchStatus === "in_progress" ? "In Progress" : "Completed"}
              </span>
            </p>
          </div>
          {gameState.freeHit && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded">
              FREE HIT ACTIVE
            </div>
          )}
        </div>
      </div>

      {gameState.matchStatus === "not_started" && (
        <button
          onClick={startMatch}
          className="bg-green-500 text-white px-4 py-2 rounded mb-6 hover:bg-green-600"
        >
          Start Match
        </button>
      )}

      {gameState.matchStatus === "in_progress" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <ScoreDisplay 
              score={gameState.score} 
              overProgress={overProgress} 
              batsmen={gameState.batsmen} 
              bowler={gameState.bowler} 
              freeHit={gameState.freeHit}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PlayerSelector
                team={gameState.currentInnings === 1 ? "A" : "B"}
                role="Striker"
                onSelect={(player) =>
                  setGameState(prev => ({ ...prev, batsmen: { ...prev.batsmen, striker: player } }))
                }
                lastBowler={null}
                matchId={matchId}
              />
              <PlayerSelector
                team={gameState.currentInnings === 1 ? "A" : "B"}
                role="Non-Striker"
                onSelect={(player) =>
                  setGameState(prev => ({ ...prev, batsmen: { ...prev.batsmen, nonStriker: player } }))
                }
                lastBowler={null}
                matchId={matchId}
              />
            </div>

            <PlayerSelector
              team={gameState.currentInnings === 1 ? "B" : "A"}
              role="Bowler"
              onSelect={(bowler) => setGameState(prev => ({ ...prev, bowler }))}
              lastBowler={gameState.lastBowler}
              matchId={matchId}
            />

            <ScoreControls 
              onScoreUpdate={handleScoreUpdate} 
              batsmen={gameState.batsmen} 
              bowler={gameState.bowler}
            />
            <WicketSelector 
              onWicket={handleWicket} 
              batsmen={gameState.batsmen} 
              bowler={gameState.bowler}
              freeHit={gameState.freeHit}
            />
          </div>

          <div className="space-y-6">
            <InningsControls 
              matchStatus={gameState.matchStatus}
              score={gameState.score}
              currentInnings={gameState.currentInnings}
              onOverComplete={handleOverComplete}
              onEndInnings={endInnings}
            />

            {gameState.batsmen.striker && (
              <BatsmanStats 
                matchId={matchId}
                batsmanId={gameState.batsmen.striker.id}
                currentInnings={gameState.currentInnings}
                onStrikeChange={() => {
                  setGameState(prev => ({
                    ...prev,
                    batsmen: {
                      striker: prev.batsmen.nonStriker,
                      nonStriker: prev.batsmen.striker
                    }
                  }));
                }}
              />
            )}

            {gameState.bowler && (
              <BowlerStats 
                bowler={gameState.bowler} 
                matchId={matchId} 
                currentInnings={gameState.currentInnings}
              />
            )}

            <BallHistory balls={gameState.balls} />
          </div>
        </div>
      )}

      {gameState.matchStatus === "completed" && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Match Completed</h2>
          <p>Final Score:</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border p-4 rounded">
              <h3 className="font-bold">{gameState.match?.teamA}</h3>
              <p>{gameState.score.runs}/{gameState.score.wickets} ({overProgress} overs)</p>
            </div>
            <div className="border p-4 rounded">
              <h3 className="font-bold">{gameState.match?.teamB}</h3>
              <p>{gameState.score.runs}/{gameState.score.wickets} ({overProgress} overs)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}