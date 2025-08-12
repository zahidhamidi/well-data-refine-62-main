import { useState } from "react";
import { Upload, BarChart3, Settings, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/drilling-hero.jpg";

const Index = () => {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const { toast } = useToast();

  const modules = [
    {
      id: "decimation",
      title: "DrillPlan Sensor Data Decimation Tool",
      description: "Decimate Sensor Data for DrillPlan Offset Wells Module",
      icon: BarChart3,
      status: "Available",
      features: ["Sensor Data Decimation", "Data Quality Audit", "Export as DIF-ingestible template"]
    },
    {
      id: "optimization",
      title: "EDGE Channel Mapping Tool",
      description: "Seemless mapping tool for InterACT-Inside",
      icon: Settings,
      status: "Coming Soon",
      features: [""]
    },
    {
      id: "reporting",
      title: "Data Reports",
      description: "Generate comprehensive drilling data reports",
      icon: FileSpreadsheet,
      status: "Coming Soon",
      features: ["Automated Reports", "Custom Templates", "Statistical Analysis", "Quality Dashboards"]
    }
  ];

  const handleModuleSelect = (moduleId: string) => {
    if (moduleId === "decimation") {
      toast({
        title: "✅ Module Launched",
        description: "Launching Data Decimation Tool...",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      setTimeout(() => window.location.href = "/decimation", 500);
    } else {
      toast({
        title: "✅ Module Selected",
        description: `${modules.find(m => m.id === moduleId)?.title} coming soon!`,
        className: "border-green-200 bg-green-50 text-green-800",
      });
      setActiveModule(moduleId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60" />
        
        <div className="relative z-10 text-center text-primary-foreground px-6 max-w-4xl">
          <h1 className="text-5xl font-bold mb-6">
            DDH Automation Hub
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Centralized hub for application and operation support tools
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Advanced Analytics
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Real-time Processing
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Industry Standard
            </Badge>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">


          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module) => {
              const Icon = module.icon;
              const isAvailable = module.status === "Available";
              
              return (
                <Card 
                  key={module.id}
                  className={`transition-all duration-300 hover:shadow-lg border-2 ${
                    isAvailable 
                      ? "hover:border-primary cursor-pointer" 
                      : "opacity-75 cursor-not-allowed"
                  }`}
                  onClick={() => isAvailable && handleModuleSelect(module.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <Icon className={`h-12 w-12 ${isAvailable ? "text-primary" : "text-muted-foreground"}`} />
                      <Badge 
                        variant={isAvailable ? "default" : "secondary"}
                        className="font-medium"
                      >
                        {module.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{module.title}</CardTitle>
                    <CardDescription className="text-base">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {module.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {isAvailable && (
                      <Button 
                        className="w-full mt-6" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModuleSelect(module.id);
                        }}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Launch Module
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-muted-foreground">
            Built for drilling engineers, by drilling engineers. 
            Professional data analysis tools for the oil & gas industry.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;