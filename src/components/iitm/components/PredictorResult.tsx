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
  // Check if the lowest grade (E) failed due to a hard eligibility rule
  const lowestGradeResult = results["E"];
  const isEligibilityFail = 
    !lowestGradeResult?.possible && 
    lowestGradeResult?.message && 
    !lowestGradeResult.message.includes("mathematically unreachable");

  // Check if ANY grade is mathematically not possible to display the blue tooltip
  const hasMathImpossible = GRADES.some(g => !results[g]?.possible && !isEligibilityFail);

  return (
    <Card className="mt-6 shadow-sm border-gray-200 font-['Inter']">
      <CardHeader className="bg-gray-50/50 pb-4 border-b border-gray-100">
        <CardTitle className="text-lg text-gray-800">Prediction Result</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        
        {isEligibilityFail ? (
          <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-lg border border-red-100 mb-6">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-red-900 text-lg mb-3">Not Possible</h4>
              
              <div className="flex items-start gap-2 bg-red-100/60 p-3 rounded-md border border-red-200 mb-3">
                <Info className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800 leading-relaxed">
                  <span className="font-semibold">"Not Possible"</span> means that even if you score a perfect 100/100 in the final exam, you cannot reach this grade based on your current marks.
                </p>
              </div>

              <div className="bg-white/60 p-3 rounded-md border border-red-100">
                <p className="text-red-900 font-medium">
                  <span className="font-bold text-red-700 mr-2">Reason:</span> 
                  {lowestGradeResult.message}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {hasMathImpossible && (
              <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-md border border-blue-100 mb-6">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800 leading-relaxed">
                  <span className="font-semibold">"Not Possible"</span> means that even if you score a perfect 100/100 in the final exam, you cannot reach this grade based on your current marks.
                </p>
              </div>
            )}

            <div className="border border-gray-200 rounded-md mb-6 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700 w-1/2">Target Grade</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-1/2">Required Final Exam Marks (/100)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {GRADES.map(grade => {
                    const res = results[grade];
                    if (!res) return null;
                    
                    return (
                      <TableRow key={grade}>
                        <TableCell className="font-medium text-gray-900">
                          Grade {grade}
                        </TableCell>
                        <TableCell>
                          {res.possible ? (
                            res.requiredScore === 0 ? (
                              <span className="text-green-600 font-semibold">Already Achieved</span>
                            ) : (
                              <span className="font-semibold text-gray-900">{res.requiredScore}</span>
                            )
                          ) : (
                            <span className="text-red-600 font-semibold">Not Possible</span>
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

        <div className="flex justify-end">
          <Button onClick={onReset} variant="outline" className="border-gray-300">
            Calculate Another
          </Button>
        </div>
        
      </CardContent>
    </Card>
  );
}
