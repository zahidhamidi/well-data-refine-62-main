import { ChannelBank } from "@/components/drilling/ChannelBank";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ChannelBankPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Full-width blue header */}
      <header className="w-full bg-[#0033A0] text-white py-6 shadow">
        <div className="container mx-auto flex items-center justify-between px-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Channel Bank Configuration
            </h1>
            <p>
              Manage standard channel names and aliases for drilling channel mapping
            </p>
          </div>
          <Button
            onClick={() => navigate("/ChannelMapping")}
            className="flex items-center gap-2 bg-white text-blue-600 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Channel Mapping
          </Button>
        </div>
      </header>

      {/* Page content */}
      <div className="container mx-auto py-8">
        <div className="bg-card rounded-lg border p-6">
          <ChannelBank />
        </div>
      </div>
    </div>


  );
}