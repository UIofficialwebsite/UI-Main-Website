import React from "react";
import { Subject } from '../types/gradeTypes';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/context/LoginModalContext";

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
  const handleCalculateClick = () => {
    onCalculate();
  };
  
  const inputFields = subject.fields.filter(f => f.id !== 'F' && !f.label.toLowerCase().includes('bonus'));

  const handleValueChange = (fieldId: string, value: string, max: number) => {
    if (value === "") {
      onInputChange(fieldId, value);
      return;
    }

    const numericValue = parseFloat(value);
    
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
      
      <div className="flex justify-between items-end pb-2 border-b border-gray-200 mb-6">
         <Label className="text-xs font-bold uppercase tracking-wide text-gray-500 font-['Inter']">
           02. Enter Internal Scores
         </Label>
      </div>

      {/* Professional, Subtle Disclaimer */}
      <div className="mb-6 p-4 bg-[#f8f9fa] border border-gray-200 rounded-sm">
        <p className="text-[13px] text-gray-600 font-['Inter'] leading-relaxed">
          <strong className="text-gray-800">Important Note:</strong> If you were absent for an exam or quiz, leave the field completely blank. If you attended but scored zero, enter <strong>0</strong>. Leaving mandatory components blank will result in an automatic 'U' prediction.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-8">
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
