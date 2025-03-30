import MatchList from "@/components/MatchList";
import Navbar from "@/components/Navbar";

export default function MatchesPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
    <Navbar/>
      <h1 className="text-2xl font-bold text-center mb-4">Live & Completed Matches</h1>
      <MatchList />
    </div>
  );
}
