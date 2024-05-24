import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // cloudnary url
      requiured: true,
    },
    thumbnail: {
      type: String, // cloudnary url
      requiured: true,
    },
    title: {
      type: String,
      requiured: true,
    },
    description: {
      type: String, // cloudnary url
      requiured: true,
    },
    duration: {
      type: Number, // from cloudnary
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
