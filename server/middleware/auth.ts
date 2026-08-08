import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      reseller?: {
        id: string;
        approvalStatus: string;
      };
    }
  }
}

/**
 * Middleware to require authentication
 * Attaches user to req.user if authenticated
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Fetch and attach user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Middleware to require admin role
 * Must be used after requireAuth
 * SECURITY: Requires BOTH admin role AND adminAuthenticated session flag
 * This ensures admins can ONLY access admin routes via the secure admin login
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // SECURITY: Check that admin logged in via the secure admin login portal
    // This prevents privilege escalation through customer login
    if (!(req.session as any).adminAuthenticated) {
      return res.status(403).json({ 
        error: "Admin authentication required. Please login via the admin portal.",
        requireAdminLogin: true
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ error: "Authorization failed" });
  }
};

/**
 * Middleware to require reseller access
 * Allows both reseller role AND vendors with reseller access
 * Must be used after requireAuth
 */
export const requireReseller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Fetch reseller data - works for both resellers and vendors with reseller access
    const reseller = await storage.getResellerByUserId(req.user.id);
    
    // Allow if user is a reseller OR a vendor with reseller access
    if (!reseller) {
      // Check if user is a vendor - if so, they need to access their dashboard first to auto-create reseller access
      if (req.user.role === "vendor") {
        return res.status(403).json({ error: "Reseller access required" });
      }
      return res.status(403).json({ error: "Reseller account not found" });
    }

    // Check if reseller is active (for proper resellers) or allow if vendor
    const isActiveReseller = reseller.isActive === true;
    const isVendorWithAccess = req.user.role === "vendor";
    
    if (!isActiveReseller && !isVendorWithAccess) {
      return res.status(403).json({ 
        error: "Reseller account not active",
        isActive: reseller.isActive 
      });
    }

    req.reseller = {
      id: reseller.id,
      approvalStatus: reseller.approvalStatus || "approved",
    };

    next();
  } catch (error) {
    console.error("Reseller middleware error:", error);
    return res.status(500).json({ error: "Authorization failed" });
  }
};

/**
 * Middleware to optionally attach user if authenticated
 * Does not block unauthenticated requests
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.session.userId;
    
    if (userId) {
      const user = await storage.getUser(userId);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    // Don't fail the request if optional auth fails
    next();
  }
};

/**
 * Middleware to require vendor access (either vendor role OR reseller with vendor profile)
 * Resellers with trial/paid licences get vendor profiles to add their own products
 * Must be used after requireAuth
 */
export const requireVendor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Fetch vendor data - this works for both vendor role users AND resellers with vendor profiles
    const vendor = await storage.getVendorByUserId(req.user.id);
    if (!vendor) {
      return res.status(403).json({ error: "Vendor access required" });
    }

    // Check approval status
    if (vendor.approvalStatus !== "approved") {
      return res.status(403).json({ 
        error: "Wholesaler account pending approval",
        approvalStatus: vendor.approvalStatus 
      });
    }

    next();
  } catch (error) {
    console.error("Vendor middleware error:", error);
    return res.status(403).json({ error: "Authorization failed" });
  }
};
