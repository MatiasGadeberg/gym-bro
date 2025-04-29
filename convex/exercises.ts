import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Mock data
const mockExercises = [
  { name: "Bench Press", muscleGroup: "chest", suggestedSets: 4 },
  { name: "Squats", muscleGroup: "legs", suggestedSets: 4 },
  { name: "Shoulder Press", muscleGroup: "shoulders", suggestedSets: 3 },
  { name: "Deadlift", muscleGroup: "back", suggestedSets: 4 },
  { name: "Bicep Curls", muscleGroup: "arms", suggestedSets: 3 },
  { name: "Leg Press", muscleGroup: "legs", suggestedSets: 4 },
  { name: "Incline Press", muscleGroup: "chest", suggestedSets: 3 },
  { name: "Lateral Raises", muscleGroup: "shoulders", suggestedSets: 3 },
  { name: "Pull-ups", muscleGroup: "back", suggestedSets: 3 },
  { name: "Tricep Extensions", muscleGroup: "arms", suggestedSets: 3 },
];

export const initializeExercises = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("exercises").collect();
    if (existing.length === 0) {
      for (const exercise of mockExercises) {
        await ctx.db.insert("exercises", exercise);
      }
    }
  },
});

export const generateWorkout = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const exercises = await ctx.db.query("exercises").collect();
    const muscleGroups = [...new Set(exercises.map(e => e.muscleGroup))];
    
    const selectedExercises = muscleGroups.map(group => {
      const groupExercises = exercises.filter(e => e.muscleGroup === group);
      const exercise = groupExercises[Math.floor(Math.random() * groupExercises.length)];
      
      return exercise;
    });

    const workout = await ctx.db.insert("workouts", {
      userId,
      exercises: selectedExercises.map(exercise => ({
        exerciseId: exercise._id,
        weight: undefined,
        reps: undefined,
      })),
      suggestedExercises: selectedExercises.map(e => e._id),
      completed: false,
    });

    return workout;
  },
});

export const getCurrentWorkout = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("completed"), false))
      .collect();

    if (workouts.length === 0) return null;

    const workout = workouts[0];
    const exerciseDetails = await Promise.all(
      workout.exercises.map(async (exercise) => {
        const details = await ctx.db.get(exercise.exerciseId);
        return {
          ...exercise,
          ...details,
        };
      })
    );

    return { ...workout, exercises: exerciseDetails };
  },
});

export const updateExercise = mutation({
  args: {
    workoutId: v.id("workouts"),
    exerciseId: v.id("exercises"),
    weight: v.optional(v.number()),
    reps: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.userId !== userId) throw new Error("Workout not found");

    const updatedExercises = workout.exercises.map(exercise =>
      exercise.exerciseId === args.exerciseId
        ? { ...exercise, weight: args.weight, reps: args.reps }
        : exercise
    );

    await ctx.db.patch(args.workoutId, { exercises: updatedExercises });

    // Save to exercise history
    if (args.weight !== undefined || args.reps !== undefined) {
      await ctx.db.insert("exerciseHistory", {
        userId,
        exerciseId: args.exerciseId,
        weight: args.weight,
        reps: args.reps,
        timestamp: Date.now(),
      });
    }
  },
});

export const rerollExercise = mutation({
  args: {
    workoutId: v.id("workouts"),
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.userId !== userId) throw new Error("Workout not found");

    const oldExercise = await ctx.db.get(args.exerciseId);
    if (!oldExercise) throw new Error("Exercise not found");
    
    const muscleGroup = oldExercise.muscleGroup;

    // Get all exercises for this muscle group
    const allExercises = await ctx.db
      .query("exercises")
      .filter(q => q.eq(q.field("muscleGroup"), muscleGroup))
      .collect();

    // Filter out already suggested exercises
    const alternatives = allExercises.filter(
      exercise => !workout.suggestedExercises?.includes(exercise._id)
    );

    // If no new exercises available, allow reusing previously suggested ones
    const newExercise = alternatives.length > 0
      ? alternatives[Math.floor(Math.random() * alternatives.length)]
      : allExercises[Math.floor(Math.random() * allExercises.length)];

    // Get user's last values for the new exercise
    const lastValues = await ctx.db
      .query("exerciseHistory")
      .withIndex("by_user_and_exercise", q => 
        q.eq("userId", userId).eq("exerciseId", newExercise._id)
      )
      .order("desc")
      .first();

    const updatedExercises = workout.exercises.map(exercise =>
      exercise.exerciseId === args.exerciseId
        ? { 
            exerciseId: newExercise._id,
            weight: lastValues?.weight,
            reps: lastValues?.reps,
          }
        : exercise
    );

    // Update the list of suggested exercises
    const updatedSuggestedExercises = [...(workout.suggestedExercises || []), newExercise._id];

    await ctx.db.patch(args.workoutId, { 
      exercises: updatedExercises,
      suggestedExercises: updatedSuggestedExercises,
    });
  },
});

export const completeWorkout = mutation({
  args: {
    workoutId: v.id("workouts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.userId !== userId) throw new Error("Workout not found");

    await ctx.db.patch(args.workoutId, { completed: true });
  },
});

export const addExercise = mutation({
  args: {
    workoutId: v.id("workouts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.userId !== userId) throw new Error("Workout not found");

    // Get all exercises
    const allExercises = await ctx.db
      .query("exercises")
      .collect();

    // Filter out already suggested exercises
    const availableExercises = allExercises.filter(
      exercise => !workout.suggestedExercises?.includes(exercise._id)
    );

    // If all exercises have been suggested, allow reusing
    const exerciseToAdd = availableExercises.length > 0
      ? availableExercises[Math.floor(Math.random() * availableExercises.length)]
      : allExercises[Math.floor(Math.random() * allExercises.length)];

    // Get user's last values for this exercise
    const lastValues = await ctx.db
      .query("exerciseHistory")
      .withIndex("by_user_and_exercise", q => 
        q.eq("userId", userId).eq("exerciseId", exerciseToAdd._id)
      )
      .order("desc")
      .first();

    const updatedExercises = [
      ...workout.exercises,
      { 
        exerciseId: exerciseToAdd._id,
        weight: lastValues?.weight,
        reps: lastValues?.reps,
      },
    ];

    // Update the list of suggested exercises
    const updatedSuggestedExercises = [...(workout.suggestedExercises || []), exerciseToAdd._id];

    await ctx.db.patch(args.workoutId, { 
      exercises: updatedExercises,
      suggestedExercises: updatedSuggestedExercises,
    });
  },
});
