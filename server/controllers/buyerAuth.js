import { handleMongoAuth } from "../api/_mongoAuth.js";

export const buyerRegister = (req, res) => handleMongoAuth(req, res, "buyer", "register");
export const buyerLogin = (req, res) => handleMongoAuth(req, res, "buyer", "login");
export const getBuyerProfile = (req, res) => handleMongoAuth(req, res, "buyer", "me");
export const updateBuyerProfile = (req, res) => handleMongoAuth(req, res, "buyer", "update");
