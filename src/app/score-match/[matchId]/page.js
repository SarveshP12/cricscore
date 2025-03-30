'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { firestoreDB, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, onValue, update, push } from 'firebase/database';
import ScoreDisplay from '@/components/ScoreDisplay';
import ScoreControls from '@/components/ScoreControls';
import BallHistory from '@/components/BallHistory';
import {WicketSelector} from '@/components/WicketSelector';
import BowlerStats from '@/components/BowlerStats';

export default function ScorerDashboard() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState({ runs: 0, wickets: 0, overs: 0, balls: 0 });
  const [ballHistory, setBallHistory] = useState([]);
  const [bowlerStats, setBowlerStats] = useState({});
  const [selectedBowler, setSelectedBowler] = useState('');
  const [batsmen, setBatsmen] = useState({ striker: '', nonStriker: '' });
  const router = useRouter();

  useEffect(() => {
    if (!matchId) return;
    const fetchMatch = async () => {
      try {
        const matchRef = doc(firestoreDB, 'matches', matchId);
        const matchSnap = await getDoc(matchRef);
        if (matchSnap.exists()) {
          setMatch(matchSnap.data());
        } else {
          console.error('Match not found!');
        }
      } catch (error) {
        console.error('Error fetching match:', error);
      }
    };
    fetchMatch();
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    const scoreRef = ref(db, `matches/${matchId}/score`);
    onValue(scoreRef, (snapshot) => {
      setScore(snapshot.val() || { runs: 0, wickets: 0, overs: 0, balls: 0 });
    });
  }, [matchId]);

  const updateScore = async (runs, isWicket = false, extraType = null, overthrowRuns = 0) => {
    if (!matchId) return;
    let newRuns = score.runs + runs + overthrowRuns;
    let newWickets = isWicket ? score.wickets + 1 : score.wickets;
    let newBalls = score.balls + 1;
    let newOvers = Math.floor(newBalls / 6) + (newBalls % 6) / 10;
    if (extraType) newBalls -= 1;
    try {
      const scoreRef = ref(db, `matches/${matchId}/score`);
      await update(scoreRef, { runs: newRuns, wickets: newWickets, overs: newOvers, balls: newBalls });
      const historyRef = ref(db, `matches/${matchId}/ballHistory`);
      await push(historyRef, { runs, isWicket, extraType, overthrowRuns, timestamp: Date.now() });
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  return (
    <div className='max-w-3xl mx-auto p-6'>
      <button onClick={() => router.back()} className='text-blue-500'>⬅ Back</button>
      <h2 className='text-3xl font-bold mt-4'>{match?.team1} vs {match?.team2}</h2>
      <label className='block mt-4'>
        <span className='text-gray-700'>Select Bowler:</span>
        <select
          className='mt-1 block w-full p-2 border rounded'
          value={selectedBowler}
          onChange={(e) => setSelectedBowler(e.target.value)}
        >
          <option value=''>Choose a bowler</option>
          {match?.bowlers?.map((bowler) => (
            <option key={bowler.id} value={bowler.id}>{bowler.name}</option>
          ))}
        </select>
      </label>
      <ScoreDisplay score={score} />
      <ScoreControls updateScore={updateScore} />
      <WicketSelector matchId={matchId} />
      {selectedBowler && <BowlerStats matchId={matchId} bowlerId={selectedBowler} />}
      <BallHistory ballHistory={ballHistory} />
    </div>
  );
}
