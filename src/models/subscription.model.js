import mongoose, { Schema, mongo } from "mongoose";
const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // One who is subscribing.
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // One to whom subscriber is subscribing.
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscriptioin", subscriptionSchema);
