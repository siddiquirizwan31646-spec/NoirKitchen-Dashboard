// setAdmin.js
require('dotenv').config();
const connectDB = require('./db');
const User = require('./models/User');

const EMAIL = process.argv[2];

if (!EMAIL) {
  console.log('Usage: node setAdmin.js siddiquirizwan31646@gmail.com');
  process.exit(1);
}

(async () => {
  await connectDB();
  const user = await User.findOneAndUpdate(
    { email: EMAIL },
    { role: 'admin' },
    { new: true }
  );
  if (!user) {
    console.log('No user found with that email.');
  } else {
    console.log(`✅ ${user.email} is now admin (role: ${user.role})`);
  }
  process.exit(0);
})();