import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <h1 className="text-4xl font-bold mb-6 text-center">🏏 Welcome to CricScore</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          Choose your role and start your cricket journey!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/scorer-dashboard">
            <div className="p-6 bg-white shadow-md rounded-lg hover:bg-blue-500 hover:text-white transition cursor-pointer">
              <h2 className="text-2xl font-bold">🏆 Host a Match</h2>
              <p>Create and manage cricket matches.</p>
            </div>
          </Link>
          <Link href="/host-tournament">
            <div className="p-6 bg-white shadow-md rounded-lg hover:bg-blue-500 hover:text-white transition cursor-pointer">
              <h2 className="text-2xl font-bold">📅 LBW Review System</h2>
              <p>Organize a full-fledged tournament.</p>
            </div>
          </Link>
          <Link href="/all-matches">
            <div className="p-6 bg-white shadow-md rounded-lg hover:bg-blue-500 hover:text-white transition cursor-pointer">
              <h2 className="text-2xl font-bold">👀 Be a Viewer</h2>
              <p>Watch live scores and match updates.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
