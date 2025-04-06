import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function BowlerStats({ bowler, matchId, currentInnings }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!matchId || !bowler || !currentInnings) return;

    const statsRef = ref(db, `matches/${matchId}/innings/${currentInnings}/playerStats/${bowler.id}`);
    const unsubscribe = onValue(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.val());
      } else {
        setStats(null);
      }
    });

    return () => unsubscribe();
  }, [matchId, bowler, currentInnings]);

  if (!bowler) return <div className="bg-white p-4 rounded shadow">No bowler selected</div>;
  if (!stats) return <div className="bg-white p-4 rounded shadow">Loading bowler stats...</div>;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">{bowler.name} - Bowling</h3>
      <div className="grid grid-cols-2 gap-2">
        <p>Overs: <span className="font-bold">{(stats.balls / 6).toFixed(1)}</span></p>
        <p>Maidens: <span className="font-bold">{stats.maidens || 0}</span></p>
        <p>Runs: <span className="font-bold">{stats.runs || 0}</span></p>
        <p>Wickets: <span className="font-bold">{stats.wickets || 0}</span></p>
        <p>Wides: <span className="font-bold">{stats.wides || 0}</span></p>
        <p>No Balls: <span className="font-bold">{stats.noballs || 0}</span></p>
        <p>Economy: <span className="font-bold">
          {stats.balls ? ((stats.runs / stats.balls) * 6).toFixed(2) : 0}
        </span></p>
      </div>
    </div>
  );
}