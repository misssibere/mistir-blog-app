const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const AddBlogPostSchema = new Schema(
  {
    title: String,
    summary: String,
    content: String,
    cover: String,
    author: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

const AddBlogPostModel = model("AddBlogPost", AddBlogPostSchema);

module.exports = AddBlogPostModel;
