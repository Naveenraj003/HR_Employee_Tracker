import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '..', '.env.local') });

if (!process.env.DB_HOST) {
  dotenv.config({ path: path.resolve(process.cwd(), '..', '.env.example') });
}

async function main() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  const dbUser = process.env.DB_USER || 'hospital_user';
  const dbPassword = process.env.DB_PASSWORD || 'hospital_password';
  const dbName = process.env.DB_NAME || 'hospital_tracker_dev';

  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  await client.connect();

  try {
    const email = 'demo@example.com';
    const password = 'password123';
    const fullName = 'Demo Employee';
    const employeeCode = 'EMP001';
    const roleId = 1; // ensure role with id=1 exists (EMPLOYEE)

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // Upsert demo user
    const upsertQuery = `
      INSERT INTO employee.users (employee_code, email, password_hash, full_name, role_id, account_status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'active', now())
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        employee_code = EXCLUDED.employee_code,
        role_id = EXCLUDED.role_id,
        account_status = 'active';
    `;

    await client.query(upsertQuery, [employeeCode, email, hash, fullName, roleId]);

    console.log('Demo user created/updated:', email);
  } catch (err) {
    console.error('Error creating demo user:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
