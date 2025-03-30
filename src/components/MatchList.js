"use client";

import { useState, useEffect } from "react";
import { firestoreDB } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import MatchCard from "./MatchCard"; // Importing MatchCard

export default function MatchList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const matchQuery = query(collection(firestoreDB, "matches"));
    const unsubscribe = onSnapshot(matchQuery, (snapshot) => {
      const matchData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMatches(matchData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-center mb-6">🏏 Live Matches</h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-300 animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {matches.map((match) => (
            <div key={match.id} onClick={() => router.push(`/match/${match.id}`)}>
              <MatchCard match={match} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
