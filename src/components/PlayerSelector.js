"use client";
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function PlayerSelector({ matchId, team, role, onSelect }) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');

  useEffect(() => {
    if (!matchId) return;
    const playersRef = ref(db, `matches/${matchId}/matchDetails/playerList${team}`);
    onValue(playersRef, (snapshot) => {
      setPlayers(snapshot.val() || []);
    });
  }, [matchId, team]);

  const handleSelect = (e) => {
    const player = e.target.value;
    setSelectedPlayer(player);
    onSelect(player);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {role} (Team {team}):
      </label>
      <select
        value={selectedPlayer}
        onChange={handleSelect}
        className="w-full p-2 border rounded"
      >
        <option value="">Select {role}</option>
        {players.map((player, index) => (
          <option key={index} value={player}>
            {player}
          </option>
        ))}
      </select>
    </div>
  );
}