const mongoose = require("mongoose");

const formResponseSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    answers: {
      type: Object,
      required: true,
    },
    category: {
      type: String,
      required: false
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false // Optional for backward compatibility or public forms if any
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FormResponse", formResponseSchema);
