import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function PlayerSelector({ team, role, onSelect, lastBowler, matchId }) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!matchId || !team) return;

    setLoading(true);
    setError(null);
    
    // Updated path to match the schema shown in the image
    const playersRef = ref(db, `matches/${matchId}/teams/team${team}/players`);
    console.log(`Fetching players from: matches/${matchId}/teams/team${team}/players`);

    const unsubscribe = onValue(playersRef, (snapshot) => {
      try {
        if (!snapshot.exists()) {
          console.warn("No players found at path");
          setPlayers([]);
          setError("No players found for this team");
          return;
        }

        const playersData = snapshot.val();
        console.log("Raw players data received:", playersData);

        // Process each player (player_0, player_1, etc.)
        const validPlayers = Object.keys(playersData).map(playerKey => {
          return {
            id: playerKey, // player_0, player_1, etc.
            name: playersData[playerKey], // Just the player name string
            team: `team${team}` // teamA or teamB
          };
        });

        console.log("Processed players:", validPlayers);

        if (validPlayers.length === 0) {
          setError("No valid players found");
        }

        // Filter if selecting bowler and lastBowler exists
        const filteredPlayers = role === "Bowler" && lastBowler
          ? validPlayers.filter(p => p.id !== lastBowler.id)
          : validPlayers;

        setPlayers(filteredPlayers);
      } catch (err) {
        console.error("Error processing player data:", err);
        setError("Failed to load players");
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Firebase read failed:", error);
      setError("Failed to connect to database");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, team, lastBowler, role]);

  const handleSelect = (e) => {
    const playerId = e.target.value;
    const player = players.find(p => p.id === playerId);
    setSelectedPlayer(playerId);
    onSelect(player);
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <label className="block mb-1 font-medium">{role}</label>
        <div className="animate-pulse py-2 px-4 bg-gray-200 rounded">
          Loading {role.toLowerCase()}s...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <label className="block mb-1 font-medium">{role}</label>
        <div className="p-2 text-red-500 border rounded">
          Error: {error}
          <div className="text-xs text-gray-500 mt-1">
            Path: matches/{matchId}/teams/team{team}/players
          </div>
        </div>
      </div>
    );
  }

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
            {player.name}
          </option>
        ))}
      </select>
      
      {players.length === 0 && !error && (
        <p className="text-sm text-red-500 mt-1">
          {role === "Bowler" && lastBowler 
            ? `${lastBowler.name} cannot bowl consecutive overs. No other bowlers available.`
            : 'No players available for selection'}
        </p>
      )}
    </div>
  );
}