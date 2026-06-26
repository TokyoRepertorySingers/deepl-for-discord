export function loadEnv(): void {
  // `cp .env.sample .env` then fill it in.
  // See https://github.com/motdotla/dotenv
  const config = require("dotenv").config().parsed;
  // Overwrite env variables anyways
  for (const k in config) {
    process.env[k] = config[k];
  }
}
