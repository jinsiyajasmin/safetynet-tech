const User = require("../models/User");
const Client = require("../models/Client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (payload) => {
  const {
    username,
    firstName,
    lastName,
    email,
    jobTitle,
    employer, // company name from frontend
    mobile,
    password,
  } = payload;

  // 1️⃣ Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    const err = new Error("User with this email or username already exists");
    err.status = 409;
    throw err;
  }

  // 2️⃣ Check if company (client) exists — case-insensitive
  const companyName = employer?.trim();
  if (!companyName) {
    const err = new Error("Company name is required");
    err.status = 400;
    throw err;
  }

  // Escape regex special characters to prevent errors
  // Escape regex special characters to prevent errors
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Use a more flexible regex: case-insensitive
  const regex = new RegExp("^" + escapeRegExp(companyName) + "$", "i");

  let client = await Client.findOne({ name: { $regex: regex } });

  if (!client) {
    // Auto-create company if not found or if the regex failed for some reason
    console.log(`Company '${companyName}' not found (Regex: ${regex}). Creating new client.`);
    client = await Client.create({ name: companyName });
  }

  // 3️⃣ Hash password
  const hashed = await bcrypt.hash(password, 10);

  // 4️⃣ Create user linked to client
  const user = await User.create({
    username,
    firstName,
    lastName,
    email,
    jobTitle,
    companyname: client.name, // store canonical name
    mobile,
    password: hashed,
    clientId: client._id,
  });

  // 5️⃣ Generate token
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role, clientId: client._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { user, token };
};



exports.login = async ({ email, password }) => {
  if (!email || !password) {
    const e = new Error('Email and password required');
    e.status = 400;
    throw e;
  }

  const lookup = String(email).trim();
  console.log('DEBUG: login attempt for ->', lookup);

  // find by email (case-insensitive) or username exact
  const user = await User.findOne({
    $or: [{ email: lookup.toLowerCase() }, { username: lookup }],
  })
    .populate("clientId")
    .exec();

  if (!user) {
    console.warn('DEBUG: user not found for ->', lookup);
    const e = new Error('Invalid credentials');
    e.status = 401;
    throw e;
  }

  console.log('DEBUG: user found id=', user._id.toString(), 'email=', user.email, 'username=', user.username);

  if (!user.password) {
    console.warn('DEBUG: user has no password stored (id=', user._id.toString(), ')');
    const e = new Error('Invalid credentials');
    e.status = 401;
    throw e;
  }

  const matches = await bcrypt.compare(password, user.password);
  console.log('DEBUG: bcrypt compare result ->', matches);

  if (!matches) {
    console.warn('DEBUG: password mismatch for user id=', user._id.toString());
    const e = new Error('Invalid credentials');
    e.status = 401;
    throw e;
  }

  if (!process.env.JWT_SECRET) {
    throw Object.assign(new Error('JWT_SECRET missing'), { status: 500 });
  }

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role, clientId: user.clientId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const u = user.toObject ? user.toObject() : user;
  delete u.password;
  return { user: u, token };
};

