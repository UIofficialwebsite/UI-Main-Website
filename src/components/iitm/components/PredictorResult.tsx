import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react";
import { PredictionResult } from "../utils/predictorLogic";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface PredictorResultProps {
  results: Record<string, PredictionResult>;
  onReset: () => void;
}

const GRADES = ["S", "A", "B", "C", "D", "E"];

export default function PredictorResult({ results, onReset }: PredictorResultProps) {
  // If the lowest grade (E) has a message not related to the 100 limit, it's a hard eligibility fail.
  const lowestGradeResult = results["E"];
  const isEligibilityFail = 
    !lowestGradeResult?.possible && 
    lowestGradeResult?.message && 
    lowestGradeResult.message !== "Even with a perfect 100 in the End Term, this grade is mathematically unreachable.";

  return (
    <Card className="mt-8 border-2 shadow-sm animate-in fade-in slide-in-from-bottom-4 font-['Inter']">
      <CardHeader className="bg-slate-50/80 pb-4 border-b border-slate-200">
        <CardTitle className="text-xl font-bold text-slate-800">Prediction Results</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        
        {isEligibilityFail ? (
          <div className="flex items-start space-x-4 p-5 bg-red-50 rounded-xl border-2 border-red-100 mb-6">
            <AlertCircle className="w-7 h-7 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-red-900 text-lg mb-2">Eligibility Requirements Not Met</h4>
              <p className="text-red-800 font-medium mb-3">
                <span className="font-bold text-red-700 mr-2">Reason:</span> 
                {lowestGradeResult.message}
              </p>
              <p className="text-sm text-red-700 opacity-90 bg-red-100/50 p-3 rounded-md">
                You must meet the minimum requirements in your internal components (Quizzes, Assignments, OPPEs) to be eligible to pass this course. Even with 100/100 in the End Term, a 'U' grade will be awarded.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 bg-blue-50/80 p-4 rounded-lg border border-blue-100 mb-6">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-900 leading-relaxed font-medium">
                <span className="font-bold text-blue-950">"Not Possible"</span> means that even if you score a perfect 100/100 in the End Term exam, you cannot mathematically reach that specific grade based on your current internal scores.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 mb-8 shadow-sm">
              <Table>
                <TableHeader className="bg-slate-100 hover:bg-slate-100">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 text-base py-4">Target Grade</TableHead>
                    <TableHead className="font-bold text-slate-700 text-base py-4 text-right pr-6">Required End Term Marks (/100)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {GRADES.map(grade => {
                    const res = results[grade];
                    if (!res) return null;
                    
                    return (
                      <TableRow key={grade} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                        <TableCell className="font-bold text-slate-800 py-4 text-lg pl-6">
                          Grade {grade}
                        </TableCell>
                        <TableCell className="py-4 text-right pr-6">
                          {res.possible ? (
                            res.requiredScore === 0 ? (
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                                Already Achieved!
                              </span>
                            ) : (
                              <span className="font-extrabold text-xl text-slate-900">
                                {res.requiredScore}
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-red-50 text-red-600 font-semibold text-sm border border-red-100">
                              Not Possible
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button 
            onClick={onReset} 
            variant="outline" 
            className="border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:text-slate-900 h-11 px-6"
          >
            Calculate Another Subject
          </Button>
        </div>
        
      </CardContent>
    </Card>
  );
}
