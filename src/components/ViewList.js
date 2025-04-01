"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import MatchCard from "@/components/MatchCard";

export default function MatchList() {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const matchesRef = ref(db, "matches");
    
    const unsubscribe = onValue(
      matchesRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const matchesData = Object.entries(snapshot.val()).map(([id, data]) => ({
            id,
            ...data,
            // Include nested score data if available
            teamAScore: data.score?.teamA || null,
            teamBScore: data.score?.teamB || null,
            // Flatten match details if they exist in matches collection
            matchName: data.matchName || `Match ${id}`,
            location: data.location || "Unknown location",
            matchDate: data.matchDate || "TBD",
            matchTime: data.matchTime || "TBD"
          }));
          setMatches(matchesData);
          setError(null);
        } else {
          setError("No matches found in the database.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map(match => (
        <div 
          key={match.id} 
          onClick={() => router.push(`/matches/${match.id}`)}
          className="cursor-pointer"
        >
          <MatchCard match={match} />
        </div>
      ))}
    </div>
  );
}