/**
 * Generate a bcrypt hash for the admin password.
 *
 * Usage:
 *   npm run hash -- "yourPasswordHere"
 *   docker compose run --rm backend npm run hash -- "yourPasswordHere"
 *
 * Copy the printed hash into the ADMIN_PASSWORD_HASH value in your .env file.
 */
import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('\n  Please provide a password:\n    npm run hash -- "yourPassword"\n');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

console.log('\nADMIN_PASSWORD_HASH=' + hash + '\n');
