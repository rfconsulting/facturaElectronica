const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');
const { cleanName, normalizeEmail, validEmail, validPassword } = require('../src/validation/auth');

(async () => {
  const fullName = cleanName(process.env.ADMIN_NAME);
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = String(process.env.ADMIN_PASSWORD || '');
  if (!fullName || !validEmail(email) || !validPassword(password)) throw new Error('Configura ADMIN_NAME, ADMIN_EMAIL y una contraseña de 12-72 caracteres con mayúscula, minúscula, número y símbolo.');
  const hash = await bcrypt.hash(password, 12);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(`INSERT INTO users (full_name,email,password_hash,role,is_superuser,status) VALUES (?,?,?,'administrator',TRUE,'active') ON DUPLICATE KEY UPDATE full_name=VALUES(full_name),password_hash=VALUES(password_hash),role='administrator',is_superuser=TRUE,status='active',auth_version=auth_version+1`, [fullName, email, hash]);
    const [[user]] = await connection.execute('SELECT id FROM users WHERE email=? LIMIT 1', [email]);
    const [[company]] = await connection.execute("SELECT id FROM companies WHERE status='active' ORDER BY id LIMIT 1");
    if (!company) throw new Error('Ejecuta npm run db:init antes de crear el administrador.');
    await connection.execute("INSERT INTO company_memberships (company_id,user_id,role,status) VALUES (?,?,'administrator','active') ON DUPLICATE KEY UPDATE role='administrator',status='active'", [company.id, user.id]);
    await connection.commit();
    console.log(`Administrador preparado: ${email} en empresa ${company.id}`);
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
})().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
