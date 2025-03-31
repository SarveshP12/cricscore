"use client";
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function BatsmanStats({ matchId, batsmanId }) {
  const [stats, setStats] = useState({
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: 0
  });

  useEffect(() => {
    if (!matchId || !batsmanId) return;
    
    const statsRef = ref(db, `matches/${matchId}/playerStats/${batsmanId}`);
    onValue(statsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setStats({
        runs: data.runs || 0,
        balls: data.balls || 0,
        fours: data.fours || 0,
        sixes: data.sixes || 0,
        strikeRate: data.strikeRate || 0
      });
    });
  }, [matchId, batsmanId]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h2 className="text-xl font-bold mb-4">Batsman Stats</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Runs</p>
          <p className="text-2xl font-bold">{stats.runs}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Balls</p>
          <p className="text-2xl font-bold">{stats.balls}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">4s</p>
          <p className="text-2xl font-bold">{stats.fours}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">6s</p>
          <p className="text-2xl font-bold">{stats.sixes}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-gray-500">Strike Rate</p>
          <p className="text-2xl font-bold">{stats.strikeRate.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}