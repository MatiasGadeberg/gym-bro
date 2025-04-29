import React from "react";

interface ExerciseCardProps {
  name: string;
  muscleGroup: string;
  localWeight: number | undefined;
  setLocalWeight: (weight: number) => void;
  localReps: number | undefined;
  setLocalReps: (reps: number) => void;
  handleReroll: () => void;
  slideDirection: number;
  suggestedSets: number;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  name,
  muscleGroup,
  localWeight,
  setLocalWeight,
  localReps,
  setLocalReps,
  handleReroll,
  slideDirection,
  suggestedSets,
}) => {
  return (
    <>
      <div className="flex justify-between items-start mb-4">
        <div className="text-left">
          <h3 className="font-semibold text-xl text-white">{name}</h3>
          <p className="text-indigo-400 text-sm capitalize">{muscleGroup}</p>
        </div>
        <button
          onClick={handleReroll}
          className="text-indigo-400 hover:text-indigo-300 transition"
          aria-label="Change exercise"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v4a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h8a2 2 0 012 2v4m-4-5v5m0 0l3-3m-3 3l-3-3" />
          </svg>
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Weight (kg)</label>
          <input
            type="number"
            value={localWeight ?? ""}
            onChange={(e) => setLocalWeight(Number(e.target.value))}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="Enter weight"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Reps</label>
          <input
            type="number"
            value={localReps ?? ""}
            onChange={(e) => setLocalReps(Number(e.target.value))}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="Enter reps"
          />
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-4">
        Suggested sets: {suggestedSets}
      </p>
    </>
  );
}; 