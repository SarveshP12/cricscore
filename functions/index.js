const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.updateMatchStatus = functions.pubsub.schedule("every 1 minutes").onRun(async () => {
  const now = new Date();
  const matchesRef = admin.firestore().collection("matches");

  const upcomingMatches = await matchesRef.where("status", "==", "upcoming").get();

  const updatePromises = upcomingMatches.docs.map(async (matchDoc) => {
    const matchData = matchDoc.data();
    const matchDateTime = new Date(`${matchData.matchDate}T${matchData.matchTime}:00Z`);
    
    if (matchDateTime.getTime() <= now.getTime()) {
      console.log(`Updating status for match: ${matchData.matchName}`);
      return matchDoc.ref.update({ status: "ongoing" });
    }
  });

  await Promise.all(updatePromises);
  console.log("Match status check completed.");
  return null;
});
