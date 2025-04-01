"use client";
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function BatsmanStats({ matchId, batsmanId, currentInnings }) {
  const [stats, setStats] = useState({
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: 0
  });

  useEffect(() => {
    if (!matchId || !batsmanId || !currentInnings) return;
    
    // Updated path to match your schema
    const statsRef = ref(db, `matches/${matchId}/playerStats/team${currentInnings === 1 ? 'A' : 'B'}/${batsmanId}/batting`);
    
    onValue(statsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setStats({
        runs: data.runs || 0,
        balls: data.ballaFaced || 0, // Matches your schema's field name
        fours: data.fours || 0,
        sixes: data.sizes || 0,      // Matches your schema's field name
        strikeRate: data.strikeRate || 0
      });
    });
  }, [matchId, batsmanId, currentInnings]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Batting</h2>
        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {stats.balls > 0 ? `${((stats.runs / stats.balls) * 100).toFixed(2)} SR` : '0.00 SR'}
        </span>
      </div>
      
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="p-2">
          <p className="text-xs text-gray-500">Runs</p>
          <p className="text-xl font-bold">{stats.runs}</p>
        </div>
        <div className="p-2">
          <p className="text-xs text-gray-500">Balls</p>
          <p className="text-xl font-bold">{stats.balls}</p>
        </div>
        <div className="p-2">
          <p className="text-xs text-gray-500">4s</p>
          <p className="text-xl font-bold">{stats.fours}</p>
        </div>
        <div className="p-2">
          <p className="text-xs text-gray-500">6s</p>
          <p className="text-xl font-bold">{stats.sixes}</p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Boundaries</span>
          <span className="font-medium">{stats.fours + stats.sixes} ({stats.fours}x4, {stats.sixes}x6)</span>
        </div>
      </div>
    </div>
  );
}