"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import HostCard from "@/components/HostCard";

export default function MatchList() {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const matchesRef = ref(db, "matches"); // Reference to the "matches" node
    
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const matchesData = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
        }));
        setMatches(matchesData);
        setError(null);
      } else {
        setMatches([]);
        setError("No matches found.");
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching matches:", error);
      setError("Failed to load matches. Please try again.");
      setLoading(false);
    });
    
    return () => unsubscribe(); // Cleanup subscription on unmount
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
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map(match => (
        <HostCard 
          key={match.id} 
          match={match}
          onClick={() => router.push(`/view-match/${match.id}`)}
        />
      ))}
    </div>
  );
}
