import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number; // 0-indexed
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center w-full px-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          {/* Circle */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                i < currentStep
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : i === currentStep
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-transparent border-gray-600 text-gray-500'
              )}
            >
              {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-[10px] mt-1 font-medium whitespace-nowrap',
                i <= currentStep ? 'text-white' : 'text-gray-500'
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {i < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 flex-1 mx-2 mb-4 transition-all',
                i < currentStep ? 'bg-emerald-500' : 'bg-gray-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
