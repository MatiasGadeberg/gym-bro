import React from "react";

interface ExerciseNavigationProps {
  currentExerciseIndex: number;
  totalExercises: number;
  handlePrevious: () => void;
  handleNext: () => void;
  handleAddExercise: () => void;
  handleEndWorkout: () => void;
}

export const ExerciseNavigation: React.FC<ExerciseNavigationProps> = ({
  currentExerciseIndex,
  totalExercises,
  handlePrevious,
  handleNext,
  handleAddExercise,
  handleEndWorkout,
}) => {
  return (
    <>
      <div className="flex justify-between mt-4">
        <button
          onClick={handlePrevious}
          disabled={currentExerciseIndex === 0}
          className="px-4 py-2 bg-gray-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
        >
          Previous
        </button>
        <span className="text-gray-400">
          {currentExerciseIndex + 1} / {totalExercises}
        </span>
        <button
          onClick={handleNext}
          disabled={currentExerciseIndex === totalExercises - 1}
          className="px-4 py-2 bg-gray-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
        >
          Next
        </button>
      </div>
      {currentExerciseIndex === totalExercises - 1 && (
        <div className="flex gap-2 justify-center mt-6">
          <button
            onClick={handleAddExercise}
            className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700 transition"
          >
            Add Exercise
          </button>
          <button
            onClick={handleEndWorkout}
            className="px-4 py-2 bg-green-600 rounded text-white hover:bg-green-700 transition"
          >
            End Workout
          </button>
        </div>
      )}
    </>
  );
}; 