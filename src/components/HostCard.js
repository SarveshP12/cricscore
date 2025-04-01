"use client";
import { useState, useEffect } from "react";
import { firestoreDB, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, update, onValue } from "firebase/database";

export default function MatchCard({ match, onClick }) {
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingMatch, setStartingMatch] = useState(false);
  const [realTimeStatus, setRealTimeStatus] = useState(null);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
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

    // Set up realtime listener for status changes
    const statusRef = ref(db, `matches/${match.id}/status`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      setRealTimeStatus(status);
      
      // Update match details if status changed
      if (matchDetails && status !== matchDetails.status) {
        fetchMatchDetails();
      }
    });

    fetchMatchDetails();

    return () => unsubscribe();
  }, [match.id, matchDetails]);

  const handleStartMatch = async () => {
    try {
      setStartingMatch(true);
      
      // Update status in Realtime Database
      const updates = {
        [`matches/${match.id}/status`]: "in_progress",
        [`matches/${match.id}/startTime`]: new Date().toISOString()
      };
      
      await update(ref(db), updates);

    } catch (error) {
      console.error("Error starting match:", error);
    } finally {
      setStartingMatch(false);
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-4 h-40 bg-gray-100 animate-pulse"></div>
    );
  }

  // Determine the current status (prioritize realtime updates)
  const currentStatus = realTimeStatus || matchDetails?.status;

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="cursor-pointer" onClick={onClick}>
        <h3 className="font-bold text-lg">{match.teamA} vs {match.teamB}</h3>
        {matchDetails && (
          <div className="mt-2 text-sm">
            <p>Status: 
              <span className={`ml-1 font-medium ${
                currentStatus === "upcoming" ? "text-blue-600" :
                currentStatus === "in_progress" ? "text-green-600" :
                "text-gray-600"
              }`}>
                {currentStatus}
              </span>
            </p>
            <p>Date: {new Date(matchDetails.matchDate).toLocaleDateString()}</p>
          </div>
        )}
      </div>
      
      {currentStatus === "upcoming" && (
        <button
          onClick={handleStartMatch}
          disabled={startingMatch}
          className={`mt-3 w-full py-2 px-4 rounded text-white font-medium ${
            startingMatch ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {startingMatch ? "Starting..." : "Start Match"}
        </button>
      )}
    </div>
  );
}