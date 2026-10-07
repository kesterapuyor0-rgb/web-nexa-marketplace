import test from "node:test";
import assert from "node:assert/strict";
import { handleMongoAuth } from "./_mongoAuth.js";

test("vendor registration returns a JSON 503 when MongoDB is not configured", async () => {
  const originalMongoUri = process.env.MONGODB_URI;
  const originalJwtSecret = process.env.JWT_SECRET;
  delete process.env.MONGODB_URI;
  process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";

  const response = {
    statusCode: 200,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };

  try {
    await handleMongoAuth(
      {
        body: {
          email: "vendor@example.com",
          password: "password123",
          business_name: "Vendor Store",
          contact_person: "Vendor",
          company_registration_no: "RC123",
          bank_name: "Bank",
          bank_account_number: "1234567890",
          requested_categories: ["Fresh farm products"]
        }
      },
      response,
      "vendor",
      "register"
    );

    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.body, {
      error: "Authentication is not configured. Check the Vercel environment variables."
    });
  } finally {
    if (originalMongoUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = originalMongoUri;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
});
