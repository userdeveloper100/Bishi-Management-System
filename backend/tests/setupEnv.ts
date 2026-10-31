// Runs before every test file. Sets the environment the services read at import time.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_SALT_ROUNDS = "4";
process.env.SMS_PROVIDER = "console";
// Local development .env can set USE_LOCAL_OTP=true, and Prisma loads .env when the app is imported.
// Tests must not inherit the local bypass, so each test file starts with it off.
process.env.USE_LOCAL_OTP = "false";
