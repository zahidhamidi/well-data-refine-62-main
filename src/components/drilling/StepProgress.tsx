import { Check } from "lucide-react";

type Step = {
  id: number;
  title: string;
  description: string;
};

type StepProgressProps = {
  steps: Step[];
  currentStep: number;
};

export const StepProgress = ({ steps, currentStep }: StepProgressProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                    ${isCompleted ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-gray-300"}
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                </div>

                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${isActive ? 'text-step-active' : isCompleted ? 'text-step-complete' : 'text-step-inactive'}`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 max-w-24">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {!isLast && (
                <div className={`w-16 h-1 mx-11 ${step.id < currentStep ? "bg-green-500" : "bg-gray-300"}`} />
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};