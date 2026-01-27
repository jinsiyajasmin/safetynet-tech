const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    jobTitle: { type: String, default: null },
    companyname: { type: String, default: null },
    mobile: { type: String, required: true, trim: true },
    password: { type: String, required: true },

    // 🔗 Link user to a client (company)
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    // 🧩 Role system
    role: {
      type: String,
      enum: ["superadmin", "admin", "user"],
      default: "user",
    },

    // ✅ NEW: User Status
    active: {
      type: Boolean,
      default: true, // user is active by default
    },
  },
  { timestamps: true }
);

// 🔒 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // If password already looks hashed, skip rehashing
  if (typeof this.password === "string" && this.password.startsWith("$2")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("User", userSchema);
