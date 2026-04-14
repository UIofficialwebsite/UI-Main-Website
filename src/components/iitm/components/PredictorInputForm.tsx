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
  
  // Filter out 'F' (End Term) AND 'Bonus' fields to show only required inputs
  const inputFields = subject.fields.filter(f => f.id !== 'F' && !f.label.toLowerCase().includes('bonus'));

  const handleValueChange = (fieldId: string, value: string, max: number) => {
    if (value === "") { onInputChange(fieldId, value); return; }
    const num = parseFloat(value);
    if (/^\d*\.?\d*$/.test(value)) {
      if (!isNaN(num) && num <= max) onInputChange(fieldId, value);
      else if (isNaN(num)) onInputChange(fieldId, value);
    }
  };

  return (
    <div className="mb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-['Inter']">
      
      <div className="flex justify-between items-end pb-2 border-b border-gray-200 mb-6">
         <Label className="text-xs font-bold uppercase tracking-wide text-gray-500 font-['Inter']">
           02. Enter Internal Scores
         </Label>
      </div>

      {/* Eligibility Disclaimer */}
      <div className="flex items-start gap-3 bg-blue-50/80 p-4 rounded-lg border border-blue-100 mb-8">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800 leading-relaxed space-y-1">
          <p>
            <span className="font-semibold text-blue-900">Important Eligibility Rule:</span>
          </p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>If you were <strong>Absent</strong> for an exam/quiz, leave the input completely blank.</li>
            <li>If you <strong>Attended</strong> but scored zero, enter <code className="bg-blue-100 px-1 py-0.5 rounded font-bold">0</code>.</li>
          </ul>
          <p className="opacity-90 pt-1">
            Leaving mandatory components (like Quizzes or GAA) blank will result in an automatic 'U' prediction.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-8">
        {/* Dynamic Inputs (Excluding Final & Bonus) */}
        {inputFields.map((field) => (
          <div key={field.id} className="space-y-3">
            <Label htmlFor={field.id} className="text-xs font-bold uppercase tracking-wide text-gray-600 font-['Inter']">
              {field.label}
            </Label>
            <Input
              id={field.id}
              type="text"
              inputMode="decimal"
              placeholder={`Enter score (<= ${field.max})`}
              value={inputValues[field.id] || ""}
              onChange={(e) => handleValueChange(field.id, e.target.value, field.max)}
              className="h-12 w-full text-lg bg-white border-2 border-gray-300 focus:border-black focus:ring-0 rounded-sm font-['Inter'] font-normal placeholder:font-normal placeholder:text-gray-300 transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-start">
        <Button 
          onClick={handleCalculateClick}
          className="h-12 px-8 bg-blue-800 text-white hover:bg-blue-900 rounded-sm font-semibold text-base font-['Inter'] transition-all shadow-sm"
        >
          Calculate Required Scores
        </Button>
      </div>
      
    </div>
  );
}
