import bcrypt from "bcryptjs";
import { store } from "../store.js";
import { signJwtToken } from "../middleware/auth.js";
import { getVendorRating } from "./vendorReviews.js";
import { normalizePhoneE164 } from "../utils/phone.js";
import { findVendorByEmail, findVendorByRegistrationNumber, isMysqlAvailable, saveVendorToMysql } from "../database/mysqlPersistence.js";
export async function vendorRegister(req, res) {
  try {
    const {
      business_name,
      contact_person,
      email,
      password,
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
      business_category,
      restaurant_business_type,
      operating_hours,
      delivery_radius_km,
      preparation_time_mins,
      hygiene_badges
    } = req.body;
    if (!business_name || !contact_person || !email || !password || !company_registration_no || !bank_name || !bank_account_number) {
      res.status(400).json({
        error: "Missing required fields. Business name, contact person, email, password, CAC/RC registration number, bank name, and bank account number are mandatory."
      });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existingVendor = isMysqlAvailable() ? await findVendorByEmail(normalizedEmail) : store.vendors.find((v) => v.email.toLowerCase() === normalizedEmail);
    if (existingVendor) {
      res.status(409).json({ error: "A vendor account with this email address already exists." });
      return;
    }
    const normalizedRegistrationNumber = company_registration_no.trim().toLowerCase();
    const existingRC = isMysqlAvailable() ? await findVendorByRegistrationNumber(normalizedRegistrationNumber) : store.vendors.find((v) => v.company_registration_no.toLowerCase() === normalizedRegistrationNumber);
    if (existingRC) {
      res.status(409).json({ error: "A vendor with this Company Registration Number (RC/CAC) has already applied." });
      return;
    }
    const password_hash = await bcrypt.hash(password, 10);
    const newVendor = {
      id: `vendor-${Date.now()}`,
      business_name: business_name.trim(),
      contact_person: contact_person.trim(),
      email: normalizedEmail,
      password_hash,
      phone: normalizePhoneE164(phone),
      city: city?.trim() || "",
      state: state?.trim() || "",
      country: country?.trim() || "Nigeria",
      location: req.body.location?.trim() || [city, state, country || "Nigeria"].filter(Boolean).join(", "),
      company_registration_no: company_registration_no.trim(),
      tax_id: tax_id || "",
      bank_name: bank_name.trim(),
      bank_account_number: bank_account_number.trim(),
      bank_account_name: bank_account_name ? bank_account_name.trim() : business_name.trim(),
      bank_code: bank_code || "057",
      store_description: store_description || "WebNexa Verified Merchant",
      store_logo_url: store_logo_url || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80",
      is_approved: false,
      // Strict: Pending Admin Verification
      rejection_reason: null,
      approved_at: null,
      approved_by_admin_id: null,
      wallet_balance: 0,
      escrow_pending_balance: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      business_category: business_category === "RESTAURANT_FOOD" ? "RESTAURANT_FOOD" : "GENERAL",
      restaurant_business_type: restaurant_business_type || "",
      operating_hours: operating_hours || "",
      delivery_radius_km: Number(delivery_radius_km) || 10,
      preparation_time_mins: Number(preparation_time_mins) || 30,
      hygiene_badges: Array.isArray(hygiene_badges) ? hygiene_badges : typeof hygiene_badges === "string" ? hygiene_badges.split(",").map((badge) => badge.trim()).filter(Boolean) : []
    };
    store.vendors.push(newVendor);
    await saveVendorToMysql(newVendor);
    if (newVendor.business_category === "RESTAURANT_FOOD") {
      const restaurant = {
        id: `restaurant-${Date.now()}`,
        vendor_id: newVendor.id,
        business_name: newVendor.business_name,
        cuisine_type: newVendor.restaurant_business_type || "Restaurant",
        opening_hours: newVendor.operating_hours || "09:00 - 22:00",
        delivery_radius_km: newVendor.delivery_radius_km || 10,
        preparation_time_mins: newVendor.preparation_time_mins || 30,
        hygiene_badges: newVendor.hygiene_badges || [],
        logo_url: newVendor.store_logo_url
      };
      store.restaurants.push(restaurant);
    }
    store.persistAuthRecords();
    const token = signJwtToken({ id: newVendor.id, email: newVendor.email, role: "vendor" });
    const { password_hash: _, ...safeVendor } = newVendor;
    res.status(201).json({
      message: "Vendor application submitted successfully. Your account is currently pending verification by The WebNexa Platform.",
      token,
      vendor: safeVendor,
      role: "vendor",
      status: "PENDING_APPROVAL"
    });
  } catch (err) {
    res.status(500).json({ error: "Vendor registration error: " + err.message });
  }
}
export async function vendorLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const vendor = isMysqlAvailable() ? await findVendorByEmail(normalizedEmail) : store.vendors.find((v) => v.email.toLowerCase() === normalizedEmail);
    if (!vendor) {
      res.status(401).json({ error: "Invalid vendor credentials." });
      return;
    }
    const isMatch = await bcrypt.compare(password, vendor.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid vendor credentials." });
      return;
    }
    const token = signJwtToken({ id: vendor.id, email: vendor.email, role: "vendor" });
    const { password_hash: _, ...safeVendor } = vendor;
    res.json({
      message: "Vendor logged in successfully.",
      token,
      vendor: safeVendor,
      role: "vendor"
    });
  } catch (err) {
    res.status(500).json({ error: "Vendor login error: " + err.message });
  }
}
export async function getVendorProfile(req, res) {
  if (!req.vendor) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const { password_hash: _, ...safeVendor } = req.vendor;
  res.json({ vendor: { ...safeVendor, ...getVendorRating(req.vendor.id) }, role: "vendor" });
}
export async function updateVendorBranding(req, res) {
  if (!req.vendor) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const logo = typeof req.body.store_logo_url === "string" ? req.body.store_logo_url.trim() : "";
  if (!/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=\s]+$/.test(logo)) {
    res.status(400).json({ error: "Please upload a valid JPEG, PNG, WEBP, or GIF logo." });
    return;
  }
  if (logo.length > 7 * 1024 * 1024) {
    res.status(413).json({ error: "Logo files must be 5 MB or smaller." });
    return;
  }
  req.vendor.store_logo_url = logo;
  req.vendor.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  const restaurant = store.restaurants.find((item) => item.vendor_id === req.vendor?.id);
  if (restaurant) restaurant.logo_url = logo;
  await saveVendorToMysql(req.vendor);
  store.persistAuthRecords();
  const { password_hash: _, ...safeVendor } = req.vendor;
  res.json({ vendor: safeVendor, restaurant });
}
