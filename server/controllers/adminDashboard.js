import { store } from "../store.js";
import { getDatabase } from "../api/_mongoAuth.js";
import { normalizeLegacyProduct, normalizeLegacyVendor } from "../utils/legacyData.js";
import { mongoIdFilters } from "../utils/mongoId.js";

function sendDatabaseError(res, operation, error) {
  console.error(`[admin] ${operation} failed`, {
    message: error instanceof Error ? error.message : String(error),
    code: error?.code
  });
  res.status(503).json({ error: "Marketplace data is temporarily unavailable. Please try again." });
}

function vendorQuery(id) {
  return { role: "vendor", $or: mongoIdFilters(id) };
}

function productQuery(id) {
  return { $or: [...mongoIdFilters(id), { slug: id }] };
}

function safeVendor(vendor) {
  const normalized = normalizeLegacyVendor(vendor);
  if (!normalized) return null;
  const { password_hash: _passwordHash, ...safeRecord } = normalized;
  return safeRecord;
}

export async function getAdminDashboardStats(req, res) {
  try {
    const db = await getDatabase();
    const accounts = db.collection("accounts");
    const products = db.collection("products");
    const [totalBuyers, vendorRecords, totalProducts, activeProducts] = await Promise.all([
      accounts.countDocuments({ role: "buyer" }),
      accounts.find({ role: "vendor" }).project({ is_approved: 1, rejection_reason: 1 }).toArray(),
      products.countDocuments(),
      products.countDocuments({ is_active: true })
    ]);
    const totalVendors = vendorRecords.length;
    const approvedVendors = vendorRecords.filter((vendor) => vendor.is_approved === true).length;
    const pendingVendors = vendorRecords.filter((vendor) => vendor.is_approved !== true && !vendor.rejection_reason).length;
    const rejectedVendors = vendorRecords.filter((vendor) => vendor.is_approved !== true && vendor.rejection_reason).length;
    let totalEscrowHeld = 0;
    let totalEscrowReleased = 0;
    let totalGmv = 0;
    store.orders.forEach((o) => {
      totalGmv += o.total_amount;
      if (["HELD_IN_ESCROW", "SHIPPED", "DELIVERED"].includes(o.status)) {
        totalEscrowHeld += o.total_amount;
      } else if (o.status === "ESCROW_RELEASED") {
        totalEscrowReleased += o.total_amount;
      }
    });
    res.json({
      stats: {
        totalGmv,
        totalEscrowHeld,
        totalEscrowReleased,
        totalBuyers,
        totalVendors,
        approvedVendors,
        pendingVendors,
        rejectedVendors,
        totalProducts,
        activeProducts,
        totalOrders: store.orders.length
      }
    });
  } catch (err) {
    sendDatabaseError(res, "Dashboard query", err);
  }
}
export async function getAllVendors(req, res) {
  try {
    const db = await getDatabase();
    const { status } = req.query;
    let vendors = await db.collection("accounts").find({ role: "vendor" }).sort({ created_at: -1 }).toArray();
    if (status === "pending") {
      vendors = vendors.filter((vendor) => vendor.is_approved !== true && !vendor.rejection_reason);
    } else if (status === "approved") {
      vendors = vendors.filter((vendor) => vendor.is_approved === true);
    } else if (status === "rejected") {
      vendors = vendors.filter((vendor) => vendor.is_approved !== true && vendor.rejection_reason);
    }
    const safeVendors = vendors.map(safeVendor).filter(Boolean);
    res.json({ vendors: safeVendors });
  } catch (err) {
    sendDatabaseError(res, "Vendor list query", err);
  }
}
export async function approveVendor(req, res) {
  try {
    const db = await getDatabase();
    const admin = req.admin;
    const { id } = req.params;
    const result = await db.collection("accounts").findOneAndUpdate(
      vendorQuery(id),
      {
        $set: {
          is_approved: true,
          rejection_reason: null,
          approved_at: new Date().toISOString(),
          approved_by_admin_id: admin?.id || admin?._id || "",
          updated_at: new Date().toISOString()
        }
      },
      { returnDocument: "after", projection: { password_hash: 0 } }
    );
    const vendor = result?.value || result;
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found in database." });
      return;
    }
    const vendorRecord = safeVendor(vendor);
    res.json({
      message: `Vendor '${vendor.business_name}' approved successfully! They are now authorized to list products on WebNexa.`,
      vendor: vendorRecord
    });
  } catch (err) {
    sendDatabaseError(res, "Vendor approval", err);
  }
}
export async function rejectVendor(req, res) {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const reason = typeof req.body?.reason === "string" && req.body.reason.trim()
      ? req.body.reason.trim()
      : "Documentation failed compliance and verification standards.";
    const result = await db.collection("accounts").findOneAndUpdate(
      vendorQuery(id),
      {
        $set: {
          is_approved: false,
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        }
      },
      { returnDocument: "after", projection: { password_hash: 0 } }
    );
    const vendor = result?.value || result;
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found in database." });
      return;
    }
    res.json({
      message: `Vendor application for '${vendor.business_name}' rejected.`,
      vendor: safeVendor(vendor)
    });
  } catch (err) {
    sendDatabaseError(res, "Vendor rejection", err);
  }
}
export async function getAllEscrowTransactions(req, res) {
  try {
    res.json({ transactions: store.escrowTransactions });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve escrow audit log: " + err.message });
  }
}
export async function getAllOrders(req, res) {
  try {
    res.json({ orders: store.orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all orders: " + err.message });
  }
}
export async function getAllAdminProducts(req, res) {
  try {
    const db = await getDatabase();
    const products = await db.collection("products").find({}).sort({ created_at: -1 }).limit(500).toArray();
    res.json({ products: products.map(normalizeLegacyProduct).filter(Boolean) });
  } catch (err) {
    sendDatabaseError(res, "Product list query", err);
  }
}
export async function approveProduct(req, res) {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const result = await db.collection("products").findOneAndUpdate(
      productQuery(id),
      { $set: { is_approved_by_admin: true, is_active: true, updated_at: new Date().toISOString() } },
      { returnDocument: "after" }
    );
    const product = result?.value || result;
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    const normalizedProduct = normalizeLegacyProduct(product);
    res.json({ message: `Product "${normalizedProduct?.title || "Product"}" approved and published to marketplace catalog.`, product: normalizedProduct });
  } catch (err) {
    sendDatabaseError(res, "Product approval", err);
  }
}
export async function toggleAutoReleaseEscrow(req, res) {
  try {
    const { autoRelease } = req.body;
    store.autoReleaseEscrow = typeof autoRelease === "boolean" ? autoRelease : !store.autoReleaseEscrow;
    res.json({
      message: `WebNexa Escrow Vault auto-release mode set to: ${store.autoReleaseEscrow ? "AUTOMATED (instant payout on delivery confirmation)" : "MANUAL (requires Admin authorization audit)"}`,
      autoReleaseEscrow: store.autoReleaseEscrow
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle escrow settings: " + err.message });
  }
}
export async function getEscrowSettings(req, res) {
  try {
    res.json({ autoReleaseEscrow: store.autoReleaseEscrow });
  } catch (err) {
    res.status(500).json({ error: "Failed to get escrow settings: " + err.message });
  }
}
