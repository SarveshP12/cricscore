"use client";
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function PlayerSelector({ matchId, team, role, onSelect }) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!matchId || !team) return;

    setLoading(true);
    const teamRef = ref(db, `matches/${matchId}/teams/team${team}/players`);
    
    const unsubscribe = onValue(teamRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          // Convert the players object to an array
          const playersObject = snapshot.val();
          const playersArray = playersObject ? Object.values(playersObject) : [];
          setPlayers(playersArray);
        } else {
          setPlayers([]);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching players:", err);
        setError("Failed to load players");
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [matchId, team]);

  const handleSelect = (e) => {
    const playerId = e.target.value;
    const player = players.find(p => p.id === playerId);
    setSelectedPlayer(playerId);
    onSelect(player);
  };

  if (loading) return <div className="p-4 bg-gray-100 rounded animate-pulse">Loading players...</div>;
  if (error) return <div className="text-red-500 p-2">Error: {error}</div>;

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
      {players.length === 0 && !loading && (
        <p className="text-sm text-gray-500 mt-1">No players available</p>
      )}
    </div>
  );
}