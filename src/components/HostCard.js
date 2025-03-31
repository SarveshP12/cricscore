"use client";
import { useState, useEffect } from "react";
import { firestoreDB } from "@/lib/firebase"; // Note: using firestoreDB now
import { doc, getDoc } from "firebase/firestore";

export default function MatchCard({ match, onClick }) {
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        // Create document reference
        const matchRef = doc(firestoreDB, "matches", match.id);
        const matchSnap = await getDoc(matchRef);
        
        if (matchSnap.exists()) {
          setMatchDetails(matchSnap.data());
        }
      } catch (error) {
        console.error("Error fetching match details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [match.id]);

  if (loading) {
    return (
      <div className="border rounded-lg p-4 h-40 bg-gray-100 animate-pulse"></div>
    );
  }

  return (
    <div 
      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <h3 className="font-bold text-lg">{match.teamA} vs {match.teamB}</h3>
      {matchDetails && (
        <div className="mt-2 text-sm">
          <p>Status: {matchDetails.status}</p>
          <p>Date: {new Date(matchDetails.matchDate).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}