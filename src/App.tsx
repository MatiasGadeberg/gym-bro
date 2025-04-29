import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { useEffect, useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import { Toaster, toast } from "sonner";
import { ExerciseCard } from "./ExerciseCard";
import { ExerciseNavigation } from "./ExerciseNavigation";

export default function App() {
  const initializeExercises = useMutation(api.exercises.initializeExercises);
  
  useEffect(() => {
    initializeExercises();
  }, [initializeExercises]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      <header className="sticky top-0 z-10 bg-gray-800/80 backdrop-blur-sm p-4 flex justify-between items-center border-b border-gray-700">
        <h2 className="text-xl font-semibold text-indigo-400">Lift Buddy</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        <Content />
      </main>
      <Toaster theme="dark" />
    </div>
  );
}

function Content() {
  const currentWorkout = useQuery(api.exercises.getCurrentWorkout);
  const generateWorkout = useMutation(api.exercises.generateWorkout);
  const updateExercise = useMutation(api.exercises.updateExercise);
  const rerollExercise = useMutation(api.exercises.rerollExercise);
  const completeWorkout = useMutation(api.exercises.completeWorkout);
  const addExercise = useMutation(api.exercises.addExercise);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(0);
  const [localWeight, setLocalWeight] = useState<number | undefined>();
  const [localReps, setLocalReps] = useState<number | undefined>();

  useEffect(() => {
    if (currentWorkout?.exercises[currentExerciseIndex]) {
      setLocalWeight(currentWorkout.exercises[currentExerciseIndex].weight);
      setLocalReps(currentWorkout.exercises[currentExerciseIndex].reps);
    }
  }, [currentWorkout, currentExerciseIndex]);

  const handleStartWorkout = async () => {
    try {
      await generateWorkout();
      setCurrentExerciseIndex(0);
      toast.success("New workout generated!");
    } catch (error) {
      toast.error("Failed to generate workout");
    }
  };

  const saveCurrentExercise = async () => {
    if (!currentWorkout) return;
    try {
      await updateExercise({
        workoutId: currentWorkout._id,
        exerciseId: currentWorkout.exercises[currentExerciseIndex].exerciseId,
        weight: localWeight,
        reps: localReps,
      });
    } catch (error) {
      toast.error("Failed to save progress");
    }
  };

  const handleReroll = async (workoutId: Id<"workouts">, exerciseId: Id<"exercises">) => {
    try {
      await rerollExercise({ workoutId, exerciseId });
      toast.success("Exercise changed!");
    } catch (error) {
      toast.error("Failed to change exercise");
    }
  };

  const handleNext = async () => {
    if (currentWorkout && currentExerciseIndex < currentWorkout.exercises.length - 1) {
      await saveCurrentExercise();
      setSlideDirection(1);
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePrevious = async () => {
    if (currentExerciseIndex > 0) {
      await saveCurrentExercise();
      setSlideDirection(-1);
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleEndWorkout = async () => {
    if (!currentWorkout) return;
    try {
      await saveCurrentExercise();
      await completeWorkout({ workoutId: currentWorkout._id });
      toast.success("Workout completed! 💪");
    } catch (error) {
      toast.error("Failed to end workout");
    }
  };

  const handleAddExercise = async () => {
    if (!currentWorkout) return;
    try {
      await saveCurrentExercise();
      await addExercise({ workoutId: currentWorkout._id });
      toast.success("Added new exercise!");
    } catch (error) {
      toast.error("Failed to add exercise");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <Authenticated>
          {!currentWorkout && (
            <button
              onClick={handleStartWorkout}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Start New Workout
            </button>
          )}
          {currentWorkout && currentWorkout.exercises.length > 0 && (
            <div>
                <ExerciseCard
                  key={currentExerciseIndex}
                  name={currentWorkout.exercises[currentExerciseIndex].name || ""}
                  muscleGroup={currentWorkout.exercises[currentExerciseIndex].muscleGroup || ""}
                  localWeight={localWeight}
                  setLocalWeight={setLocalWeight}
                  localReps={localReps}
                  setLocalReps={setLocalReps}
                  handleReroll={() => handleReroll(
                    currentWorkout._id,
                    currentWorkout.exercises[currentExerciseIndex].exerciseId
                  )}
                  slideDirection={slideDirection}
                  suggestedSets={currentWorkout.exercises[currentExerciseIndex].suggestedSets || 0}
                />
              <ExerciseNavigation
                currentExerciseIndex={currentExerciseIndex}
                totalExercises={currentWorkout.exercises.length}
                handlePrevious={handlePrevious}
                handleNext={handleNext}
                handleAddExercise={handleAddExercise}
                handleEndWorkout={handleEndWorkout}
              />
            </div>
          )}
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-gray-400 mb-8">Sign in to start your workout</p>
          <SignInForm />
        </Unauthenticated>
      </div>
    </div>
  );
}
