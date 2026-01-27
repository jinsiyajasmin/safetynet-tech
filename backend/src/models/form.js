const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    id: String,
    label: String,
    value: String,
  },
  { _id: false }
);

const fieldSchema = new mongoose.Schema(
  {
    id: String,
    type: String,
    label: String,
    name: String,
    required: Boolean,
    options: [optionSchema],
  },
  { _id: false }
);

const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled Form",
    },
    titleColor: {
      type: String,
      default: "#000000",
    },
    titleAlignment: {
      type: String,
      default: "left",
    },
    fields: {
      type: [fieldSchema],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // change if your user model name is different
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Form", formSchema);
