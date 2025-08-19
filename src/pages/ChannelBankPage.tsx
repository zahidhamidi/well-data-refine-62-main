import { ChannelBank } from "@/components/drilling/ChannelBank";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ChannelBankPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Channel Bank Management
            </h1>
            <p className="text-muted-foreground">
              Manage standard channel names and aliases for drilling data mapping
            </p>
          </div>
          <Button
            onClick={() => navigate("/ChannelMapping")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Channel Mapping
          </Button>
        </header>

        <div className="bg-card rounded-lg border p-6">
          <ChannelBank />
        </div>
      </div>
    </div>
  );
}