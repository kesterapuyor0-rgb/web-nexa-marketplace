import { handleMongoAuth } from "../api/_mongoAuth.js";

export const vendorRegister = (req, res) => handleMongoAuth(req, res, "vendor", "register");
export const vendorLogin = (req, res) => handleMongoAuth(req, res, "vendor", "login");
export const getVendorProfile = (req, res) => handleMongoAuth(req, res, "vendor", "me");
export const updateVendorBranding = (req, res) => handleMongoAuth(req, res, "vendor", "update");
