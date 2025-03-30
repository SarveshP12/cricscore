import HostMatchForm from "@/components/HostMatchForm";
import Navbar from "@/components/Navbar";

export default function HostMatchPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto flex flex-col items-center py-12">
        <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md">
          <HostMatchForm />
        </div>
      </div>
    </div>
  );
}
