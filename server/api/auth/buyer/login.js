import { handleMongoAuth } from "../../_mongoAuth.js";
export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  return handleMongoAuth(req, res, "buyer", "login");
}
