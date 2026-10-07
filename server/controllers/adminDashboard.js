import { store } from "../store.js";
export async function getAdminDashboardStats(req, res) {
  try {
    const totalBuyers = store.buyers.length;
    const totalVendors = store.vendors.length;
    const approvedVendors = store.vendors.filter((v) => v.is_approved).length;
    const pendingVendors = store.vendors.filter((v) => !v.is_approved && !v.rejection_reason).length;
    const rejectedVendors = store.vendors.filter((v) => !v.is_approved && v.rejection_reason).length;
    const totalProducts = store.products.length;
    const activeProducts = store.products.filter((p) => p.is_active).length;
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
    res.status(500).json({ error: "Failed to aggregate admin statistics: " + err.message });
  }
}
export async function getAllVendors(req, res) {
  try {
    const { status } = req.query;
    let vendors = store.vendors;
    if (status === "pending") {
      vendors = vendors.filter((v) => !v.is_approved && !v.rejection_reason);
    } else if (status === "approved") {
      vendors = vendors.filter((v) => v.is_approved);
    } else if (status === "rejected") {
      vendors = vendors.filter((v) => !v.is_approved && v.rejection_reason);
    }
    const safeVendors = vendors.map(({ password_hash: _, ...v }) => v);
    res.json({ vendors: safeVendors });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vendor records: " + err.message });
  }
}
export async function approveVendor(req, res) {
  try {
    const admin = req.admin;
    const { id } = req.params;
    const vendor = store.vendors.find((v) => v.id === id);
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found in database." });
      return;
    }
    vendor.is_approved = true;
    vendor.rejection_reason = null;
    vendor.approved_at = (/* @__PURE__ */ new Date()).toISOString();
    vendor.approved_by_admin_id = admin.id;
    vendor.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    const { password_hash: _, ...safeVendor } = vendor;
    res.json({
      message: `Vendor '${vendor.business_name}' approved successfully! They are now authorized to list products on WebNexa.`,
      vendor: safeVendor
    });
  } catch (err) {
    res.status(500).json({ error: "Vendor approval failed: " + err.message });
  }
}
export async function rejectVendor(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const vendor = store.vendors.find((v) => v.id === id);
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found in database." });
      return;
    }
    vendor.is_approved = false;
    vendor.rejection_reason = reason || "Documentation failed compliance and verification standards.";
    vendor.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    const { password_hash: _, ...safeVendor } = vendor;
    res.json({
      message: `Vendor application for '${vendor.business_name}' rejected.`,
      vendor: safeVendor
    });
  } catch (err) {
    res.status(500).json({ error: "Vendor rejection failed: " + err.message });
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
    res.json({ products: store.products });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products: " + err.message });
  }
}
export async function approveProduct(req, res) {
  try {
    const { id } = req.params;
    const product = store.products.find((p) => p.id === id);
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    product.is_approved_by_admin = true;
    product.is_active = true;
    product.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    res.json({ message: `Product "${product.title}" approved and published to marketplace catalog.`, product });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve product: " + err.message });
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
