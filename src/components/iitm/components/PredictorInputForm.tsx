import React from "react";
import { Subject } from '../types/gradeTypes';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/context/LoginModalContext";
import { Info } from "lucide-react";

interface PredictorInputFormProps {
  subject: Subject;
  inputValues: Record<string, string>;
  onInputChange: (fieldId: string, value: string) => void;
  onCalculate: () => void;
}

export default function PredictorInputForm({ 
  subject, 
  inputValues, 
  onInputChange, 
  onCalculate
}: PredictorInputFormProps) {
  const { user } = useAuth();
  const { openLogin } = useLoginModal();
  
  const handleCalculateClick = () => {
    if (!user) { openLogin(); return; }
    onCalculate();
  };
  
  // Predictor specifically filters out 'F' (End Term) and 'Bonus' fields
  const inputFields = subject.fields.filter(f => f.id !== 'F' && !f.label.toLowerCase().includes('bonus'));

  const handleValueChange = (fieldId: string, value: string, max: number) => {
    // Allow empty string to let user clear input (Absent)
    if (value === "") { 
      onInputChange(fieldId, value); 
      return; 
    }
    
    const numericValue = parseFloat(value);
    
    // Valid if it matches numeric/decimal pattern
    if (/^\d*\.?\d*$/.test(value)) {
      if (!isNaN(numericValue) && numericValue <= max) {
        onInputChange(fieldId, value);
      } else if (isNaN(numericValue)) {
        onInputChange(fieldId, value);
      }
    }
  };

  return (
    <div className="mb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-['Inter']">
      
      <div className="flex justify-between items-end pb-2 border-b border-slate-200 mb-6">
         <Label className="text-xs font-bold uppercase tracking-wide text-slate-500 font-['Inter']">
           02. Enter Internal Scores
         </Label>
      </div>

      {/* Eligibility Disclaimer */}
      <div className="flex items-start gap-3 bg-blue-50/80 p-4 rounded-lg border border-blue-100 mb-8">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-900 leading-relaxed space-y-1">
          <p>
            <span className="font-bold text-blue-950">Important Eligibility Rule:</span>
          </p>
          <ul className="list-disc pl-4 space-y-0.5 font-medium">
            <li>If you were <strong>Absent</strong> for an exam/quiz, leave the input completely blank.</li>
            <li>If you <strong>Attended</strong> but scored zero, enter <code className="bg-white/80 px-1.5 py-0.5 rounded font-bold border border-blue-200 text-blue-700">0</code>.</li>
          </ul>
          <p className="opacity-90 pt-1 text-blue-800">
            Leaving mandatory components (like Quizzes or GAA) blank will result in an automatic 'U' prediction.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-8">
        {inputFields.map((field) => (
          <div key={field.id} className="space-y-3">
            <Label htmlFor={field.id} className="text-xs font-bold uppercase tracking-wide text-slate-600 font-['Inter']">
              {field.label}
            </Label>
            <Input
              id={field.id}
              type="text"
              inputMode="decimal"
              placeholder={`Max: ${field.max}`}
              value={inputValues[field.id] || ""}
              onChange={(e) => handleValueChange(field.id, e.target.value, field.max)}
              className="h-12 w-full text-lg bg-white border-2 border-slate-300 focus:border-slate-900 focus:ring-0 rounded-md font-['Inter'] font-medium placeholder:font-normal placeholder:text-slate-400 transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-start">
        <Button 
          onClick={handleCalculateClick}
          className="h-12 px-8 bg-slate-900 text-white hover:bg-slate-800 rounded-md font-semibold text-base font-['Inter'] transition-all shadow-sm"
        >
          Calculate Required Scores
        </Button>
      </div>
      
    </div>
  );
}
