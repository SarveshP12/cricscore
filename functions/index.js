const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.onScoreUpdate = functions.database
  .ref("/events/{matchId}/score-updates/{ballId}")
  .onWrite(async (change, context) => {
    const matchId = context.params.matchId;
    const ballId = context.params.ballId;
    const newScore = change.after.val();

    if (!newScore) return null; // Ignore deletions

    console.log(`New score recorded for match ${matchId}:`, newScore);

    // Update match summary in Firebase
    return admin.database().ref(`/matches/${matchId}/summary`).update({
      lastRun: newScore.run,
      lastBall: ballId,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    });
  });
