

## Plan: Fix toolLogger + Integrate into All 4 Calculator Tools

### 1. Fix `src/utils/toolLogger.ts` (build errors)

- Change `.select("phone_number")` → `.select("phone")` and `profile.phone_number` → `profile.phone`
- Cast table reference: `.from("tool_usage_logs" as any)` to bypass missing type
- Add `"Foundation Marks Predictor"` to the `toolName` union type

### 2. Integrate into `CGPACalculator.tsx`

In `handleCalculate()` (line 136), add logging right before `setShowReport(true)`:
- Extract course data dynamically from `courses` array
- Log `toolName: "CGPA Calculator"`, with `inputDetails.subject_details` containing current CGPA, credits, and course list

### 3. Integrate into `GradeCalculator.tsx`

In `calculateGrade()` (line 82), add logging right before `setResult(...)`:
- Dynamically iterate `inputValues`, filter metadata keys, format labels
- Log `toolName: "Grade Calculator"` with branch, level, subject name, and scores

### 4. Integrate into `MarksPredictor.tsx`

In `handleCalculate()` (line 66), add logging right before `setResults(newResults)`:
- Same dynamic extraction pattern from `inputValues`
- Log `toolName: "Marks Predictor"` with subject, scores, and prediction results

### 5. Refactor `FoundationMarksPredictor.tsx` — add Calculate button + logger

Currently auto-computes via `useMemo`. Changes:
- Replace reactive `useMemo` for `requiredFs` with a `useState`
- Add `handleCalculate()` function that computes results and logs usage
- Add auth gate (login required on Calculate click)
- Add Calculate and Reset buttons
- Results table only shows after clicking Calculate
- Log `toolName: "Foundation Marks Predictor"` with subject, scores, and required marks table

### Logging pattern (applied to all)

```typescript
import { logToolUsage } from "@/utils/toolLogger";

// Right before setting result state:
try {
  const metaKeys = ["id","name","credits","grade","subject","marks","scores","result","target"];
  const scores: Record<string, number> = {};
  Object.entries(inputValues).forEach(([key, val]) => {
    if (!metaKeys.includes(key)) {
      scores[key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")] = parseFloat(val) || 0;
    }
  });
  logToolUsage({ toolName: "...", branch, level,
    inputDetails: { subject_details: { subject: currentSubject.name, scores } },
    resultDetails: result
  });
} catch (e) { /* silent */ }
```

### Files changed

| File | Change |
|------|--------|
| `src/utils/toolLogger.ts` | Fix phone column, type cast, add tool name |
| `src/components/iitm/CGPACalculator.tsx` | Add logger in `handleCalculate` |
| `src/components/iitm/GradeCalculator.tsx` | Add logger in `calculateGrade` |
| `src/components/iitm/MarksPredictor.tsx` | Add logger in `handleCalculate` |
| `src/components/iitm/FoundationMarksPredictor.tsx` | Add Calculate button + auth gate + logger |

No changes to any calculation formulas or grading logic.

