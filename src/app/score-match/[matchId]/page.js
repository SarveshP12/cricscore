"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { firestoreDB, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, onValue, push, set, get, update } from "firebase/database";

// Helper function to ensure valid numeric values
const safeNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

// Default extras object structure
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

    const inningsRef = ref(db, `matches/${matchId}/currentInnings`);
    const statusRef = ref(db, `matches/${matchId}/status`);
    const ballsRef = ref(db, `matches/${matchId}/currentBall`);
    const scoreRef = ref(db, `matches/${matchId}/innings/${currentInnings}/score`);
    const ballsHistoryRef = ref(db, `matches/${matchId}/innings/${currentInnings}/balls`);
    const lastBallRef = ref(db, `matches/${matchId}/innings/${currentInnings}/lastBall`);

    const unsubscribeInnings = onValue(inningsRef, (snapshot) => {
      setCurrentInnings(safeNumber(snapshot.val(), 1));
    });

    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      setMatchStatus(snapshot.val() || "not_started");
    });

    const unsubscribeBalls = onValue(ballsRef, (snapshot) => {
      setTotalBalls(safeNumber(snapshot.val()));
    });

    const unsubscribeScore = onValue(scoreRef, (snapshot) => {
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

    const unsubscribeBallsHistory = onValue(ballsHistoryRef, (snapshot) => {
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

    const unsubscribeLastBall = onValue(lastBallRef, (snapshot) => {
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
      const ballsRef = ref(db, `${inningsPath}/balls`);
      const newBallRef = push(ballsRef);
      
      const completeBallData = {
        ...ballData,
        batsman: batsmen.striker,
        nonStriker: batsmen.nonStriker,
        bowler: bowler,
        timestamp: Date.now(),
        over: safeNumber(score.overs),
        ball: safeNumber(score.balls) + 1,
        isFreeHit: freeHit,
        runs: safeNumber(ballData.runs),
        extras: {
          wides: safeNumber(ballData.extras?.wide),
          noballs: safeNumber(ballData.extras?.noball),
          byes: safeNumber(ballData.extras?.byes),
          legbyes: safeNumber(ballData.extras?.legbyes),
          penalty: safeNumber(ballData.extras?.penalty),
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
        updates.runs = safeNumber(currentStats.runs) + safeNumber(ballData.runs);
        updates.balls = safeNumber(currentStats.balls) + 1;
        
        if (ballData.runs === 4) updates.fours = safeNumber(currentStats.fours) + 1;
        if (ballData.runs === 6) updates.sixes = safeNumber(currentStats.sixes) + 1;
      } else {
        updates.status = `out (${ballData.wicket.type})`;
        // Keep existing runs and balls count
        updates.runs = safeNumber(currentStats.runs);
        updates.balls = safeNumber(currentStats.balls);
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
        balls: safeNumber(currentStats.balls) + (ballData.extras?.wide || ballData.extras?.noball ? 0 : 1),
        runs: safeNumber(currentStats.runs) + 
              safeNumber(ballData.runs) + 
              safeNumber(ballData.extras?.wide) + 
              safeNumber(ballData.extras?.noball)
      };

      if (ballData.wicket && ['bowled', 'caught', 'lbw', 'stumped', 'hitwicket'].includes(ballData.wicket.type)) {
        updates.wickets = safeNumber(currentStats.wickets) + 1;
      }

      if (ballData.extras?.wide) {
        updates.wides = safeNumber(currentStats.wides) + 1;
      }

      if (ballData.extras?.noball) {
        updates.noballs = safeNumber(currentStats.noballs) + 1;
      }

      await update(bowlerRef, updates);
    }
  };

  const handleScoreUpdate = async (runs, extras = {}) => {
    if (!batsmen.striker || !batsmen.nonStriker || !bowler) {
      alert("Please select both batsmen and bowler before scoring");
      return;
    }

    const runsValue = safeNumber(runs);
    const extrasValue = {
      wide: safeNumber(extras.wide),
      noball: safeNumber(extras.noball),
      byes: safeNumber(extras.byes),
      legbyes: safeNumber(extras.legbyes),
      penalty: safeNumber(extras.penalty)
    };

    const isExtraBall = extrasValue.wide > 0 || extrasValue.noball > 0;
    const runsToAdd = runsValue + extrasValue.wide + extrasValue.noball + 
                     extrasValue.byes + extrasValue.legbyes + extrasValue.penalty;
    
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
      runs: safeNumber(currentScore.runs) + runsToAdd,
      wickets: safeNumber(currentScore.wickets),
      balls: safeNumber(currentScore.balls) + (isExtraBall ? 0 : 1),
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
      runs: safeNumber(inningsScore.runs) + runsToAdd,
      wickets: safeNumber(inningsScore.wickets),
      balls: safeNumber(inningsScore.balls) + (isExtraBall ? 0 : 1),
      extras: {
        wides: safeNumber(inningsScore.extras?.wides) + extrasValue.wide,
        noballs: safeNumber(inningsScore.extras?.noballs) + extrasValue.noball,
        byes: safeNumber(inningsScore.extras?.byes) + extrasValue.byes,
        legbyes: safeNumber(inningsScore.extras?.legbyes) + extrasValue.legbyes,
        penalty: safeNumber(inningsScore.extras?.penalty) + extrasValue.penalty,
      }
    });

    if (!isExtraBall) {
      await set(ref(db, `matches/${matchId}/currentBall`), safeNumber(totalBalls) + 1);
    }

    if (extrasValue.noball > 0) {
      setFreeHit(true);
    } else if (!isExtraBall) {
      setFreeHit(false);
    }

    // Rotate strike if odd runs (except on last ball of over)
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

    const runsValue = safeNumber(wicketData.runs);
    const extrasValue = wicketData.extras ? {
      wide: safeNumber(wicketData.extras.wide),
      noball: safeNumber(wicketData.extras.noball),
      byes: safeNumber(wicketData.extras.byes),
      legbyes: safeNumber(wicketData.extras.legbyes),
      penalty: safeNumber(wicketData.extras.penalty)
    } : { ...defaultExtras };

    const isExtraBall = extrasValue.wide > 0 || extrasValue.noball > 0;
    const runsToAdd = runsValue + extrasValue.wide + extrasValue.noball + 
                     extrasValue.byes + extrasValue.legbyes + extrasValue.penalty;

    try {
      // Record the ball first
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

      // Update the score
      const teamPath = currentInnings === 1 ? "teamA" : "teamB";
      const scoreRef = ref(db, `matches/${matchId}/score/${teamPath}`);
      const snapshot = await get(scoreRef);
      const currentScore = snapshot.exists() ? snapshot.val() : { runs: 0, wickets: 0, balls: 0 };
      
      await set(scoreRef, {
        runs: safeNumber(currentScore.runs) + runsToAdd,
        wickets: safeNumber(currentScore.wickets) + 1,
        balls: safeNumber(currentScore.balls) + (isExtraBall ? 0 : 1),
      });

      // Update innings score
      const inningsPath = `matches/${matchId}/innings/${currentInnings}/score`;
      const inningsSnapshot = await get(ref(db, inningsPath));
      const inningsScore = inningsSnapshot.exists() ? inningsSnapshot.val() : { 
        runs: 0, 
        wickets: 0, 
        balls: 0,
        extras: { ...defaultExtras }
      };
      
      await set(ref(db, inningsPath), {
        runs: safeNumber(inningsScore.runs) + runsToAdd,
        wickets: safeNumber(inningsScore.wickets) + 1,
        balls: safeNumber(inningsScore.balls) + (isExtraBall ? 0 : 1),
        extras: {
          wides: safeNumber(inningsScore.extras?.wides) + extrasValue.wide,
          noballs: safeNumber(inningsScore.extras?.noballs) + extrasValue.noball,
          byes: safeNumber(inningsScore.extras?.byes) + extrasValue.byes,
          legbyes: safeNumber(inningsScore.extras?.legbyes) + extrasValue.legbyes,
          penalty: safeNumber(inningsScore.extras?.penalty) + extrasValue.penalty,
        }
      });

      if (!isExtraBall) {
        await set(ref(db, `matches/${matchId}/currentBall`), safeNumber(totalBalls) + 1);
      }

      // Prompt for new batsman
      const newBatsman = prompt("Enter name of new batsman coming in:");
      if (newBatsman) {
        const newBatsmanData = { id: Date.now().toString(), name: newBatsman };
        setBatsmen(prev => ({
          ...prev,
          striker: newBatsmanData
        }));
        
        // Add new batsman to player stats
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

    // Rotate strike at end of over
    setBatsmen(prev => ({
      striker: prev.nonStriker,
      nonStriker: prev.striker
    }));

    // Set last bowler and reset current bowler
    setLastBowler(bowler);
    setBowler(null);

    // Prompt for new bowler
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

  const ScoreDisplay = () => (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold text-lg mb-2">Current Score</h3>
      {(!batsmen.striker || !batsmen.nonStriker) && (
        <p className="text-red-500 text-sm mb-2">⚠️ Please select both batsmen</p>
      )}
      {!bowler && (
        <p className="text-red-500 text-sm mb-2">⚠️ Please select a bowler</p>
      )}
      <div className="flex justify-between items-center mb-4">
        <div className="text-3xl font-bold">
          {score.runs}/{score.wickets}
        </div>
        <div className="text-xl">
          Overs: {overProgress}
        </div>
      </div>
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <p className="text-sm font-medium">Striker:</p>
            <p className="font-bold">{batsmen.striker?.name || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Non-Striker:</p>
            <p className="font-bold">{batsmen.nonStriker?.name || "Not set"}</p>
          </div>
        </div>
        <div className="mb-2">
          <p className="text-sm font-medium">Bowler:</p>
          <p className="font-bold">{bowler?.name || "Not set"}</p>
        </div>
        <p className="text-sm text-gray-600">
          Extras: {Object.entries(score.extras)
            .filter(([_, value]) => value > 0)
            .map(([type, value]) => `${type}: ${value}`)
            .join(', ')}
        </p>
        {freeHit && (
          <p className="text-sm text-red-500 font-bold">FREE HIT</p>
        )}
      </div>
    </div>
  );

  const BallHistory = () => (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Ball History</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {balls.length === 0 ? (
          <p>No balls recorded yet</p>
        ) : (
          balls.map((ball) => (
            <div 
              key={ball.id} 
              className={`border-b pb-2 ${ball.wicket ? 'text-red-500' : ''} ${ball.isFreeHit ? 'bg-yellow-50' : ''}`}
            >
              <p>{`${ball.over}.${ball.ball}: ${ball.bowler?.name || 'Bowler'} to ${ball.batsman?.name || 'Batsman'}`}</p>
              <p className="text-sm">
                {ball.wicket ? `Wicket (${ball.wicket.type})` :
                ball.runs > 0 ? `${ball.runs} run${ball.runs > 1 ? 's' : ''}` : "Dot ball"}
                {ball.extras ? ` + ${Object.entries(ball.extras)
                  .filter(([_, value]) => value > 0)
                  .map(([type, value]) => `${type} (${value})`)
                  .join(', ')}` : ''}
                {ball.isFreeHit ? ' [FREE HIT]' : ''}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const PlayerSelector = ({ team, role, onSelect }) => {
    const [players, setPlayers] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState("");

    useEffect(() => {
      if (!matchId || !team) return;

      const teamRef = ref(db, `matches/${matchId}/teams/team${team}/players`);
      const unsubscribe = onValue(teamRef, (snapshot) => {
        if (snapshot.exists()) {
          let playersData = snapshot.val();
          let playersArray = playersData ? Object.values(playersData) : [];
          
          if (role === "Bowler" && lastBowler) {
            playersArray = playersArray.filter(player => player.id !== lastBowler.id);
          }
          
          setPlayers(playersArray);
        } else {
          setPlayers([]);
        }
      });

      return () => unsubscribe();
    }, [matchId, team, lastBowler, role]);

    const handleSelect = (e) => {
      const playerId = e.target.value;
      const player = players.find(p => p.id === playerId);
      setSelectedPlayer(playerId);
      onSelect(player);
    };

    return (
      <div className="bg-white p-4 rounded shadow">
        <label className="block mb-1 font-medium">{role}</label>
        <select
          value={selectedPlayer}
          onChange={handleSelect}
          className="w-full p-2 border rounded"
          disabled={players.length === 0}
        >
          <option value="">Select {role}</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name} ({player.role || 'Player'})
            </option>
          ))}
        </select>
        {role === "Bowler" && lastBowler && players.length === 0 && (
          <p className="text-sm text-red-500 mt-1">
            {lastBowler.name} cannot bowl consecutive overs. Please wait until next over.
          </p>
        )}
      </div>
    );
  };

  const ScoreControls = ({ onScoreUpdate }) => {
    const isDisabled = !batsmen.striker || !batsmen.nonStriker || !bowler;

    const handleRunClick = (runs) => {
      if (isDisabled) {
        alert("Please select both batsmen and bowler before scoring");
        return;
      }
      onScoreUpdate(runs);
    };

    const handleExtra = (extraType) => {
      if (isDisabled) {
        alert("Please select both batsmen and bowler before scoring");
        return;
      }
      if (extraType === "wide" || extraType === "noball") {
        onScoreUpdate(0, { [extraType]: 1 });
      } else {
        onScoreUpdate(0, { [extraType]: 1 });
      }
    };

    const handlePenalty = () => {
      if (isDisabled) {
        alert("Please select both batsmen and bowler before scoring");
        return;
      }
      const runs = parseInt(prompt("Enter penalty runs (usually 5):", "5"));
      if (!isNaN(runs)) {
        onScoreUpdate(0, { penalty: runs });
      }
    };

    return (
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">Score Controls</h3>
        {isDisabled && (
          <p className="text-red-500 mb-2">Please select batsmen and bowler first</p>
        )}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[0, 1, 2, 3, 4, 6].map((run) => (
            <button
              key={run}
              onClick={() => handleRunClick(run)}
              className={`py-2 px-4 rounded ${
                isDisabled 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              disabled={isDisabled}
            >
              {run}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => handleExtra("wide")}
            className={`py-2 px-4 rounded ${
              isDisabled 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
            disabled={isDisabled}
          >
            Wide (+1 run)
          </button>
          <button
            onClick={() => handleExtra("noball")}
            className={`py-2 px-4 rounded ${
              isDisabled 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
            disabled={isDisabled}
          >
            No Ball (+1 run)
          </button>
          <button
            onClick={() => handleExtra("byes")}
            className={`py-2 px-4 rounded ${
              isDisabled 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
            disabled={isDisabled}
          >
            Byes
          </button>
          <button
            onClick={() => handleExtra("legbyes")}
            className={`py-2 px-4 rounded ${
              isDisabled 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
            disabled={isDisabled}
          >
            Leg Byes
          </button>
        </div>
        <button
          onClick={handlePenalty}
          className={`py-2 px-4 rounded w-full ${
            isDisabled 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-gray-500 text-white hover:bg-gray-600'
          }`}
          disabled={isDisabled}
        >
          Add Penalty Runs
        </button>
      </div>
    );
  };

  const WicketSelector = ({ onWicket }) => {
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
      
      onWicket({
        type: wicketType,
        runs: safeNumber(runs),
        extras: Object.keys(extras).length > 0 ? {
          wide: safeNumber(extras.wide),
          noball: safeNumber(extras.noball),
          byes: safeNumber(extras.byes),
          legbyes: safeNumber(extras.legbyes),
          penalty: safeNumber(extras.penalty)
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
        [extraType]: safeNumber(value)
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
              onChange={(e) => setRuns(safeNumber(e.target.value))}
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
  };

  const InningsControls = ({ matchId, currentInnings, matchStatus }) => {
    return (
      <div className="bg-white p-4 rounded shadow space-y-4">
        <h3 className="font-bold">Innings Controls</h3>
        
        {matchStatus === "in_progress" && (
          <button
            onClick={handleOverComplete}
            className={`bg-blue-500 text-white py-2 px-4 rounded w-full hover:bg-blue-600 ${
              score.balls !== 5 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={score.balls !== 5}
          >
            Complete Over
          </button>
        )}

        {matchStatus === "in_progress" && (
          <button
            onClick={endInnings}
            className="bg-green-500 text-white py-2 px-4 rounded w-full hover:bg-green-600"
          >
            {currentInnings === 1 ? "End 1st Innings" : "End Match"}
          </button>
        )}
      </div>
    );
  };

  const BatsmanStats = ({ matchId, batsman, inningsNumber }) => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
      if (!matchId || !batsman || !inningsNumber) return;

      const statsRef = ref(db, `matches/${matchId}/innings/${inningsNumber}/playerStats/${batsman.id}`);
      const unsubscribe = onValue(statsRef, (snapshot) => {
        if (snapshot.exists()) {
          setStats(snapshot.val());
        } else {
          setStats(null);
        }
      });

      return () => unsubscribe();
    }, [matchId, batsman, inningsNumber]);

    if (!batsman) return <div className="bg-white p-4 rounded shadow">No batsman selected</div>;
    if (!stats) return <div className="bg-white p-4 rounded shadow">Loading batsman stats...</div>;

    return (
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">{batsman.name} - Batting</h3>
        <div className="grid grid-cols-2 gap-2">
          <p>Runs: <span className="font-bold">{safeNumber(stats.runs)}</span></p>
          <p>Balls: <span className="font-bold">{safeNumber(stats.balls)}</span></p>
          <p>4s: <span className="font-bold">{safeNumber(stats.fours)}</span></p>
          <p>6s: <span className="font-bold">{safeNumber(stats.sixes)}</span></p>
          <p>SR: <span className="font-bold">
            {stats.balls ? ((safeNumber(stats.runs) / safeNumber(stats.balls)) * 100).toFixed(2) : 0}
          </span></p>
          <p>Status: <span className="font-bold">{stats.status || "batting"}</span></p>
        </div>
      </div>
    );
  };

  const BowlerStats = ({ matchId, bowler, inningsNumber }) => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
      if (!matchId || !bowler || !inningsNumber) return;

      const statsRef = ref(db, `matches/${matchId}/innings/${inningsNumber}/playerStats/${bowler.id}`);
      const unsubscribe = onValue(statsRef, (snapshot) => {
        if (snapshot.exists()) {
          setStats(snapshot.val());
        } else {
          setStats(null);
        }
      });

      return () => unsubscribe();
    }, [matchId, bowler, inningsNumber]);

    if (!bowler) return <div className="bg-white p-4 rounded shadow">No bowler selected</div>;
    if (!stats) return <div className="bg-white p-4 rounded shadow">Loading bowler stats...</div>;

    return (
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">{bowler.name} - Bowling</h3>
        <div className="grid grid-cols-2 gap-2">
          <p>Overs: <span className="font-bold">{(safeNumber(stats.balls) / 6).toFixed(1)}</span></p>
          <p>Maidens: <span className="font-bold">{safeNumber(stats.maidens)}</span></p>
          <p>Runs: <span className="font-bold">{safeNumber(stats.runs)}</span></p>
          <p>Wickets: <span className="font-bold">{safeNumber(stats.wickets)}</span></p>
          <p>Wides: <span className="font-bold">{safeNumber(stats.wides)}</span></p>
          <p>No Balls: <span className="font-bold">{safeNumber(stats.noballs)}</span></p>
          <p>Economy: <span className="font-bold">
            {stats.balls ? ((safeNumber(stats.runs) / safeNumber(stats.balls)) * 6).toFixed(2) : 0}
          </span></p>
        </div>
      </div>
    );
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
            <ScoreDisplay />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PlayerSelector
                team={currentInnings === 1 ? "A" : "B"}
                role="Striker"
                onSelect={(player) =>
                  setBatsmen((prev) => ({ ...prev, striker: player }))
                }
              />
              <PlayerSelector
                team={currentInnings === 1 ? "A" : "B"}
                role="Non-Striker"
                onSelect={(player) =>
                  setBatsmen((prev) => ({ ...prev, nonStriker: player }))
                }
              />
            </div>

            <PlayerSelector
              team={currentInnings === 1 ? "B" : "A"}
              role="Bowler"
              onSelect={setBowler}
            />

            <ScoreControls onScoreUpdate={handleScoreUpdate} />
            <WicketSelector onWicket={handleWicket} />
          </div>

          <div className="space-y-6">
            <InningsControls 
              matchId={matchId} 
              currentInnings={currentInnings} 
              matchStatus={matchStatus} 
            />

            {batsmen.striker && (
              <BatsmanStats 
                matchId={matchId} 
                batsman={batsmen.striker} 
                inningsNumber={currentInnings}
              />
            )}

            {bowler && (
              <BowlerStats 
                matchId={matchId} 
                bowler={bowler} 
                inningsNumber={currentInnings}
              />
            )}

            <BallHistory />
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