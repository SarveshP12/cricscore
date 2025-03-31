"use client";
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function BowlerStats({ matchId, bowlerId }) {
  const [stats, setStats] = useState({
    overs: 0,
    maidens: 0,
    runs: 0,
    wickets: 0,
    economy: 0
  });

  useEffect(() => {
    if (!matchId || !bowlerId) return;
    
    const statsRef = ref(db, `matches/${matchId}/playerStats/${bowlerId}`);
    onValue(statsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setStats({
        overs: data.overs || 0,
        maidens: data.maidens || 0,
        runs: data.runs || 0,
        wickets: data.wickets || 0,
        economy: data.economy || 0
      });
    });
  }, [matchId, bowlerId]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h2 className="text-xl font-bold mb-4">Bowler Stats</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Overs</p>
          <p className="text-2xl font-bold">{stats.overs.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Maidens</p>
          <p className="text-2xl font-bold">{stats.maidens}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Runs</p>
          <p className="text-2xl font-bold">{stats.runs}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Wickets</p>
          <p className="text-2xl font-bold">{stats.wickets}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-gray-500">Economy</p>
          <p className="text-2xl font-bold">{stats.economy.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}