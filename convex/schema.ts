import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  exercises: defineTable({
    name: v.string(),
    muscleGroup: v.string(),
    suggestedSets: v.number(),
    description: v.optional(v.string()),
  }),
  workouts: defineTable({
    userId: v.id("users"),
    exercises: v.array(
      v.object({
        exerciseId: v.id("exercises"),
        weight: v.optional(v.number()),
        reps: v.optional(v.number()),
      })
    ),
    suggestedExercises: v.optional(v.array(v.id("exercises"))), // Make optional for backward compatibility
    completed: v.boolean(),
  }).index("by_user", ["userId"]),
  exerciseHistory: defineTable({
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
    weight: v.optional(v.number()),
    reps: v.optional(v.number()),
    timestamp: v.number(),
  })
  .index("by_user_and_exercise", ["userId", "exerciseId"])
  .index("by_exercise_time", ["exerciseId", "timestamp"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
