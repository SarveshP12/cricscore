"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { firestoreDB, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, set } from "firebase/database";

export default function HostMatchForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    matchName: "",
    matchType: "T20",
    location: "",
    matchDate: "",
    matchTime: "",
    teamA: "",
    teamB: "",
    playerListA: [],
    playerListB: [],
    casualOvers: "20",
    uploadedFileName: "",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData, [name]: value };
    if (name === "matchType") {
      switch (value) {
        case "T20": updatedData.casualOvers = "20"; break;
        case "ODI": updatedData.casualOvers = "50"; break;
        case "5-over": updatedData.casualOvers = "5"; break;
        case "10-over": updatedData.casualOvers = "10"; break;
        case "Casual": updatedData.casualOvers = ""; break;
        case "Test (Unlimited Overs)": updatedData.casualOvers = "Unlimited"; break;
        default: updatedData.casualOvers = "";
      }
    }
    setFormData(updatedData);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, uploadedFileName: file.name }));
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (jsonData.length > 1) {
          const teamA = jsonData[0][0] || "Team A";
          const teamB = jsonData[0][1] || "Team B";
          const playerListA = jsonData.slice(1).map((row) => ({
            id: `player_${Math.random().toString(36).substr(2, 9)}`,
            name: row[0] || "",
            battingStyle: row[2] || "Right-handed",
            bowlingStyle: row[3] || "Right-arm medium",
            role: row[4] || "Player"
          })).filter(player => player.name);
          const playerListB = jsonData.slice(1).map((row) => ({
            id: `player_${Math.random().toString(36).substr(2, 9)}`,
            name: row[1] || "",
            battingStyle: row[2] || "Right-handed",
            bowlingStyle: row[3] || "Right-arm medium",
            role: row[4] || "Player"
          })).filter(player => player.name);
          setFormData((prev) => ({ ...prev, teamA, teamB, playerListA, playerListB }));
        }
      } catch (err) {
        setError("Error reading the Excel file. Ensure correct format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, uploadedFileName: "", teamA: "", teamB: "", playerListA: [], playerListB: [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);
  
    if (!formData.matchName || !formData.teamA || !formData.teamB || !formData.matchDate || !formData.matchTime) {
      setError("Match name, date, time, and both teams are required!");
      setIsSubmitting(false);
      return;
    }
  
    try {
      // 1. Create match in Firestore (for structured data and querying)
      const matchData = {
        matchName: formData.matchName,
        matchType: formData.matchType,
        location: formData.location,
        matchDate: formData.matchDate,
        matchTime: formData.matchTime,
        teamA: formData.teamA,
        teamB: formData.teamB,
        totalOvers: formData.casualOvers,
        status: "upcoming",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const matchRef = await addDoc(collection(firestoreDB, "matches"), matchData);
      const matchId = matchRef.id;

      // 2. Create comprehensive match structure in Realtime Database
      const realtimeMatchData = {
        // Match metadata
        matchDetails: {
          ...matchData,
          id: matchId,
          createdAt: Date.now(),
        },
        
        // Teams and players
        teams: {
          teamA: {
            name: formData.teamA,
            players: formData.playerListA.reduce((acc, player) => {
              acc[player.id] = player;
              return acc;
            }, {})
          },
          teamB: {
            name: formData.teamB,
            players: formData.playerListB.reduce((acc, player) => {
              acc[player.id] = player;
              return acc;
            }, {})
          }
        },
        
        // Match state
        currentInnings: 1,
        currentOver: 0,
        currentBall: 0,
        status: "upcoming",
        
        // Score tracking
        score: {
          teamA: { 
            runs: 0, 
            wickets: 0, 
            overs: 0,
            balls: 0,
            extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0 }
          },
          teamB: { 
            runs: 0, 
            wickets: 0, 
            overs: 0,
            balls: 0,
            extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0 }
          },
        },
        
        // Innings data
        innings: {
          1: {
            battingTeam: "teamA",
            bowlingTeam: "teamB",
            startedAt: null,
            endedAt: null,
            status: "not_started",
            score: 0,
            wickets: 0,
            overs: 0,
            balls: [],
            currentBatsmen: {
              striker: null,
              nonStriker: null
            },
            currentBowler: null
          },
          2: {
            battingTeam: "teamB",
            bowlingTeam: "teamA",
            startedAt: null,
            endedAt: null,
            status: "not_started",
            score: 0,
            wickets: 0,
            overs: 0,
            balls: [],
            currentBatsmen: {
              striker: null,
              nonStriker: null
            },
            currentBowler: null
          }
        },
        
        // Player statistics
        playerStats: {
          teamA: formData.playerListA.reduce((acc, player) => {
            acc[player.id] = {
              batting: {
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                strikeRate: 0,
                status: "not_out"
              },
              bowling: {
                overs: 0,
                maidens: 0,
                runs: 0,
                wickets: 0,
                economy: 0
              },
              fielding: {
                catches: 0,
                runouts: 0,
                stumpings: 0
              }
            };
            return acc;
          }, {}),
          teamB: formData.playerListB.reduce((acc, player) => {
            acc[player.id] = {
              batting: {
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                strikeRate: 0,
                status: "not_out"
              },
              bowling: {
                overs: 0,
                maidens: 0,
                runs: 0,
                wickets: 0,
                economy: 0
              },
              fielding: {
                catches: 0,
                runouts: 0,
                stumpings: 0
              }
            };
            return acc;
          }, {})
        },
        
        // Match events log
        events: []
      };

      await set(ref(db, `matches/${matchId}`), realtimeMatchData);

      setSuccessMessage("Match successfully created with comprehensive structure!");
      setTimeout(() => router.push(`/score-match/${matchId}`), 2000);
    } catch (err) {
      console.error("Error creating match:", err);
      setError("Error creating match. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-center">Host a Cricket Match</h2>
      {error && <p className="text-red-500 text-center">{error}</p>}
      {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <input type="text" name="matchName" placeholder="Match Name" value={formData.matchName} onChange={handleChange} className="p-2 border rounded" required />
        <select name="matchType" value={formData.matchType} onChange={handleChange} className="p-2 border rounded">
          <option value="T20">T20</option>
          <option value="ODI">ODI</option>
          <option value="Test (Unlimited Overs)">Test (Unlimited Overs)</option>
          <option value="5-over">5-over</option>
          <option value="10-over">10-over</option>
          <option value="Casual">Casual Match</option>
        </select>
        {formData.matchType === "Casual" && (
          <input type="number" name="casualOvers" placeholder="Number of Overs" value={formData.casualOvers} onChange={handleChange} className="p-2 border rounded" required />
        )}
        <input type="text" name="location" placeholder="Match Location" value={formData.location} onChange={handleChange} className="p-2 border rounded" required />
        <input type="date" name="matchDate" value={formData.matchDate} onChange={handleChange} className="p-2 border rounded" required />
        <input type="time" name="matchTime" value={formData.matchTime} onChange={handleChange} className="p-2 border rounded" required />
        <div className="col-span-2">
          <label className="block mb-1">Upload Teams Excel (Column A: Team A Players, Column B: Team B Players)</label>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="w-full p-2 border rounded" />
          {formData.uploadedFileName && (
            <div className="flex items-center mt-2">
              <span className="text-sm">{formData.uploadedFileName}</span>
              <button type="button" onClick={removeFile} className="ml-2 text-red-500">✖</button>
            </div>
          )}
        </div>
        <button 
          type="submit" 
          className="col-span-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Match..." : "Host Match"}
        </button>
      </form>
    </div>
  );
}