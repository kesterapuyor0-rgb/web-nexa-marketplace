import { handleMongoAuth } from "../api/_mongoAuth.js";

export const adminLogin = (req, res) => handleMongoAuth(req, res, "admin", "login");
export const getAdminProfile = (req, res) => handleMongoAuth(req, res, "admin", "me");
