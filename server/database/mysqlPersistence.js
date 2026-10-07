import mysql from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "webnexa_user",
  password: process.env.MYSQL_PASSWORD || "webnexa_password",
  database: process.env.MYSQL_DATABASE || "webnexa_marketplace",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});
const mysqlPersistenceEnabled = () => process.env.MYSQL_PERSISTENCE_ENABLED !== "false";
let mysqlAvailable = false;
let mysqlWarningShown = false;
export function isMysqlAvailable() {
  return mysqlAvailable;
}
function requireMysql() {
  if (!mysqlPersistenceEnabled() || !mysqlAvailable) {
    throw new Error(
      "MySQL persistence is not available. Check MYSQL_* configuration and database connectivity."
    );
  }
}
export async function initializeMysqlDatabase() {
  if (!mysqlPersistenceEnabled()) {
    return false;
  }
  try {
    const schemaPath = path.join(process.cwd(), "server", "database", "schema.sql");
    const schema = await fs.readFile(schemaPath, "utf8");
    await pool.query(schema);
    const vendorLocationColumns = [
      ["city", "VARCHAR(100) NULL"],
      ["state", "VARCHAR(100) NULL"],
      ["country", "VARCHAR(100) NOT NULL DEFAULT 'Nigeria'"]
    ];
    for (const [column, definition] of vendorLocationColumns) {
      const [existing] = await pool.execute(
        "SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendors' AND COLUMN_NAME = ?",
        [column]
      );
      if (Number(existing[0].count) === 0) {
        await pool.query(`ALTER TABLE vendors ADD COLUMN ${column} ${definition}`);
      }
    }
    await pool.query("SELECT 1");
    mysqlAvailable = true;
    console.log("[database] MySQL schema initialized successfully.");
    return true;
  } catch (error) {
    mysqlAvailable = false;
    console.error(
      "[database] MySQL initialization failed. Runtime will use the configured local fallback.",
      error
    );
    if (process.env.MYSQL_REQUIRED === "true") {
      throw error;
    }
    return false;
  }
}
async function withMysql(operation) {
  if (!mysqlPersistenceEnabled() || !mysqlAvailable) {
    return null;
  }
  try {
    return await operation();
  } catch (error) {
    if (!mysqlWarningShown) {
      mysqlWarningShown = true;
      console.error(
        "[database] MySQL persistence operation failed; local runtime data will continue until the database is available.",
        error
      );
    }
    return null;
  }
}
function formatMysqlDatetime(dateInput) {
  if (!dateInput) {
    return null;
  }
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 19).replace("T", " ");
}
export async function saveVendorToMysql(vendor) {
  requireMysql();
  await pool.execute(
    `INSERT INTO vendors (
        id,
        business_name,
        contact_person,
        email,
        password_hash,
        phone,
        city,
        state,
        country,
        company_registration_no,
        tax_id,
        bank_name,
        bank_account_number,
        bank_account_name,
        bank_code,
        store_description,
        store_logo_url,
        is_approved,
        rejection_reason,
        approved_at,
        approved_by_admin_id,
        wallet_balance,
        escrow_pending_balance,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        business_name = VALUES(business_name),
        contact_person = VALUES(contact_person),
        phone = VALUES(phone),
        city = VALUES(city),
        state = VALUES(state),
        country = VALUES(country),
        company_registration_no = VALUES(company_registration_no),
        tax_id = VALUES(tax_id),
        bank_name = VALUES(bank_name),
        bank_account_number = VALUES(bank_account_number),
        bank_account_name = VALUES(bank_account_name),
        bank_code = VALUES(bank_code),
        store_description = VALUES(store_description),
        store_logo_url = VALUES(store_logo_url),
        is_approved = VALUES(is_approved),
        rejection_reason = VALUES(rejection_reason),
        approved_at = VALUES(approved_at),
        approved_by_admin_id = VALUES(approved_by_admin_id),
        wallet_balance = VALUES(wallet_balance),
        escrow_pending_balance = VALUES(escrow_pending_balance),
        updated_at = VALUES(updated_at)
    `,
    [
      vendor.id,
      vendor.business_name,
      vendor.contact_person,
      vendor.email,
      vendor.password_hash,
      vendor.phone,
      vendor.city || null,
      vendor.state || null,
      vendor.country || "Nigeria",
      vendor.company_registration_no,
      vendor.tax_id || null,
      vendor.bank_name,
      vendor.bank_account_number,
      vendor.bank_account_name,
      vendor.bank_code,
      vendor.store_description,
      vendor.store_logo_url,
      vendor.is_approved,
      vendor.rejection_reason || null,
      formatMysqlDatetime(vendor.approved_at),
      vendor.approved_by_admin_id || null,
      vendor.wallet_balance,
      vendor.escrow_pending_balance,
      formatMysqlDatetime(vendor.created_at),
      formatMysqlDatetime(vendor.updated_at)
    ]
  );
}
export async function saveBuyerToMysql(buyer) {
  requireMysql();
  await pool.execute(
    `
      INSERT INTO buyers (
        id,
        full_name,
        email,
        password_hash,
        phone,
        shipping_address_line1,
        shipping_address_line2,
        city,
        state,
        country,
        postal_code,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        phone = VALUES(phone),
        shipping_address_line1 = VALUES(shipping_address_line1),
        shipping_address_line2 = VALUES(shipping_address_line2),
        city = VALUES(city),
        state = VALUES(state),
        country = VALUES(country),
        postal_code = VALUES(postal_code),
        updated_at = VALUES(updated_at)
    `,
    [
      buyer.id,
      buyer.full_name,
      buyer.email,
      buyer.password_hash,
      buyer.phone,
      buyer.shipping_address_line1,
      buyer.shipping_address_line2 || null,
      buyer.city,
      buyer.state,
      buyer.country,
      buyer.postal_code,
      formatMysqlDatetime(buyer.created_at),
      formatMysqlDatetime(buyer.updated_at)
    ]
  );
}
export async function saveAdminToMysql(admin) {
  requireMysql();
  await pool.execute(
    `
      INSERT INTO admins (
        id,
        username,
        name,
        email,
        password_hash,
        privilege_level,
        last_login,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        password_hash = VALUES(password_hash),
        privilege_level = VALUES(privilege_level),
        last_login = VALUES(last_login),
        updated_at = VALUES(updated_at)
    `,
    [
      admin.id,
      admin.email.split("@")[0],
      admin.name,
      admin.email,
      admin.password_hash,
      admin.privilege_level,
      formatMysqlDatetime(admin.last_login),
      formatMysqlDatetime(admin.created_at),
      formatMysqlDatetime(admin.updated_at)
    ]
  );
}
export async function findBuyerByEmail(email) {
  requireMysql();
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        full_name,
        email,
        password_hash,
        phone,
        shipping_address_line1,
        shipping_address_line2,
        city,
        state,
        country,
        postal_code,
        created_at,
        updated_at
      FROM buyers
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );
  return rows[0] || null;
}
export async function findVendorByEmail(email) {
  requireMysql();
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        business_name,
        contact_person,
        email,
        password_hash,
        phone,
        city,
        state,
        country,
        company_registration_no,
        tax_id,
        bank_name,
        bank_account_number,
        bank_account_name,
        bank_code,
        store_description,
        store_logo_url,
        is_approved,
        rejection_reason,
        approved_at,
        approved_by_admin_id,
        wallet_balance,
        escrow_pending_balance,
        created_at,
        updated_at
      FROM vendors
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );
  return rows[0] || null;
}
export async function findVendorByRegistrationNumber(registrationNumber) {
  requireMysql();
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        business_name,
        contact_person,
        email,
        password_hash,
        phone,
        city,
        state,
        country,
        company_registration_no,
        tax_id,
        bank_name,
        bank_account_number,
        bank_account_name,
        bank_code,
        store_description,
        store_logo_url,
        is_approved,
        rejection_reason,
        approved_at,
        approved_by_admin_id,
        wallet_balance,
        escrow_pending_balance,
        created_at,
        updated_at
      FROM vendors
      WHERE company_registration_no = ?
      LIMIT 1
    `,
    [registrationNumber]
  );
  return rows[0] || null;
}
export async function findAdminByEmail(email) {
  requireMysql();
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        name,
        email,
        password_hash,
        privilege_level,
        last_login,
        created_at,
        updated_at
      FROM admins
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );
  return rows[0] || null;
}
export async function synchronizeAuthRecordsToMysql(buyers, vendors, admins) {
  requireMysql();
  for (const admin of admins) {
    await saveAdminToMysql(admin);
  }
  for (const buyer of buyers) {
    await saveBuyerToMysql(buyer);
  }
  for (const vendor of vendors) {
    await saveVendorToMysql(vendor);
  }
  console.log(
    `[database] Synchronized ${buyers.length} buyers, ${vendors.length} vendors, and ${admins.length} admins.`
  );
}
export async function saveVendorReviewToMysql(review) {
  requireMysql();
  await pool.execute(
    `
      INSERT INTO vendor_reviews (
        id,
        vendor_id,
        buyer_id,
        order_id,
        rating,
        review_text,
        photo_url,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        review_text = VALUES(review_text),
        photo_url = VALUES(photo_url)
    `,
    [
      review.id,
      review.vendor_id,
      review.buyer_id,
      review.order_id,
      review.rating,
      review.review_text || null,
      review.photo_url || null,
      review.created_at
    ]
  );
}
export async function listVendorReviewsFromMysql(vendorId) {
  const rowsResult = await withMysql(async () => {
    const [rows] = await pool.execute(
      `
        SELECT
          id,
          vendor_id,
          buyer_id,
          order_id,
          rating,
          review_text,
          photo_url,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS created_at
        FROM vendor_reviews
        WHERE vendor_id = ?
        ORDER BY created_at DESC
      `,
      [vendorId]
    );
    return rows;
  });
  return rowsResult;
}
export async function closeMysqlPersistence() {
  await pool.end();
}
