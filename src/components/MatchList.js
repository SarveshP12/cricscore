"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestoreDB } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestoreDB";
import MatchCard from "@/components/MatchCard";

export default function MatchList() {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // Proper collection reference
        const matchesCollection = collection(firestoreDB, "matches");
        const querySnapshot = await getDocs(matchesCollection);
        
        const matchesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setMatches(matchesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
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
        <MatchCard 
          key={match.id} 
          match={match}
          onClick={() => router.push(`/match/${match.id}`)}
        />
      ))}
    </div>
  );
}