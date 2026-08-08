import { CommissionRule, PartnerCommissionOverride } from "@shared/schema";

interface PartnerCommissionInput {
  partnerType: 'reseller' | 'vendor';
  partnerId: string;
  productId: string;
  productCommissionRate: number | null; // Default rate from product.partnerCommissionRate
}

interface PartnerCommissionResult {
  commissionRate: number;
  storefrontPrice: number | null;
  source: 'partner_override_product' | 'partner_override_global' | 'product_default' | 'none';
}

interface CommissionCalculationInput {
  productId: string;
  productPrice: number;
  categoryName: string;
  resellerId: string;
  orderSubtotal: number;
  resellerDefaultRate?: number; // Fallback commission rate from reseller's profile
}

interface CommissionResult {
  platformCommission: number;
  resellerEarnings: number;
  appliedRule: CommissionRule | null;
  effectiveRate: number; // For reporting purposes
}

/**
 * Commission Calculation Engine
 * 
 * Finds the most applicable commission rule and calculates earnings split
 * between platform and reseller.
 * 
 * Rule Priority:
 * 1. Specific product + specific reseller (highest priority)
 * 2. Specific product + all resellers
 * 3. Specific category + specific reseller
 * 4. Specific category + all resellers
 * 5. All products + specific reseller
 * 6. All products + all resellers (default fallback)
 * 
 * Within each priority level, rules are sorted by their explicit priority value.
 */
export class CommissionService {
  /**
   * Get effective commission rate for a partner and product
   * 
   * Priority:
   * 1. Partner-specific product override (highest priority)
   * 2. Partner-specific global override (applies to all products)
   * 3. Product's default partner commission rate
   * 4. No commission (0%)
   */
  static getEffectivePartnerCommission(
    input: PartnerCommissionInput,
    overrides: PartnerCommissionOverride[]
  ): PartnerCommissionResult {
    // Filter overrides for this partner
    const partnerOverrides = overrides.filter(o => {
      if (o.partnerType !== input.partnerType) return false;
      if (!o.isActive) return false;
      if (input.partnerType === 'reseller' && o.resellerId !== input.partnerId) return false;
      if (input.partnerType === 'vendor' && o.vendorId !== input.partnerId) return false;
      return true;
    });

    // First, check for product-specific override
    const productOverride = partnerOverrides.find(o => o.productId === input.productId);
    if (productOverride) {
      return {
        commissionRate: parseFloat(productOverride.commissionRate),
        storefrontPrice: productOverride.storefrontPrice ? parseFloat(productOverride.storefrontPrice) : null,
        source: 'partner_override_product'
      };
    }

    // Second, check for global override (no product specified)
    const globalOverride = partnerOverrides.find(o => o.productId === null);
    if (globalOverride) {
      return {
        commissionRate: parseFloat(globalOverride.commissionRate),
        storefrontPrice: globalOverride.storefrontPrice ? parseFloat(globalOverride.storefrontPrice) : null,
        source: 'partner_override_global'
      };
    }

    // Third, use product's default partner commission rate
    if (input.productCommissionRate !== null && input.productCommissionRate > 0) {
      return {
        commissionRate: input.productCommissionRate,
        storefrontPrice: null,
        source: 'product_default'
      };
    }

    // No commission rate found
    return {
      commissionRate: 0,
      storefrontPrice: null,
      source: 'none'
    };
  }

  /**
   * Calculate commission split for a single product in an order
   */
  static calculateProductCommission(
    input: CommissionCalculationInput,
    rules: CommissionRule[]
  ): CommissionResult {
    // Filter active rules
    const activeRules = rules.filter(rule => rule.isActive);

    // Find the most applicable rule
    const applicableRule = this.findBestApplicableRule(input, activeRules);

    if (!applicableRule) {
      // No rule found - check if reseller has a default commission rate
      if (input.resellerDefaultRate && input.resellerDefaultRate > 0) {
        const commissionRate = input.resellerDefaultRate / 100;
        const resellerEarnings = input.productPrice * commissionRate;
        const platformCommission = input.productPrice - resellerEarnings;
        return {
          platformCommission,
          resellerEarnings,
          appliedRule: null,
          effectiveRate: input.resellerDefaultRate
        };
      }
      // No rate set - platform keeps 100%
      return {
        platformCommission: input.productPrice,
        resellerEarnings: 0,
        appliedRule: null,
        effectiveRate: 0
      };
    }

    // Calculate commission based on rule type
    let resellerEarnings = 0;

    if (applicableRule.commissionType === 'percentage') {
      // Percentage-based commission
      const commissionRate = parseFloat(applicableRule.commissionValue) / 100;
      resellerEarnings = input.productPrice * commissionRate;
    } else if (applicableRule.commissionType === 'fixed_amount') {
      // Fixed amount commission
      resellerEarnings = parseFloat(applicableRule.commissionValue);
      // Ensure commission doesn't exceed product price
      resellerEarnings = Math.min(resellerEarnings, input.productPrice);
    }

    const platformCommission = input.productPrice - resellerEarnings;

    return {
      platformCommission,
      resellerEarnings,
      appliedRule: applicableRule,
      effectiveRate: (resellerEarnings / input.productPrice) * 100
    };
  }

  /**
   * Calculate total commission for an entire order
   */
  static calculateOrderCommission(
    items: CommissionCalculationInput[],
    rules: CommissionRule[]
  ): {
    totalPlatformCommission: number;
    totalResellerEarnings: number;
    itemBreakdown: CommissionResult[];
  } {
    const itemBreakdown = items.map(item => 
      this.calculateProductCommission(item, rules)
    );

    const totalPlatformCommission = itemBreakdown.reduce(
      (sum, result) => sum + result.platformCommission, 
      0
    );

    const totalResellerEarnings = itemBreakdown.reduce(
      (sum, result) => sum + result.resellerEarnings, 
      0
    );

    return {
      totalPlatformCommission,
      totalResellerEarnings,
      itemBreakdown
    };
  }

  /**
   * Find the best applicable rule using priority system
   */
  private static findBestApplicableRule(
    input: CommissionCalculationInput,
    rules: CommissionRule[]
  ): CommissionRule | null {
    // Check minimum order amount first
    const qualifyingRules = rules.filter(rule => {
      if (!rule.minOrderAmount) return true;
      return input.orderSubtotal >= parseFloat(rule.minOrderAmount);
    });

    if (qualifyingRules.length === 0) return null;

    // Define priority scoring
    const scoreRule = (rule: CommissionRule): number => {
      let score = 0;

      // Specific product match (highest weight)
      if (rule.productId === input.productId) {
        score += 1000;
      } else if (rule.productId !== null) {
        // Rule is for a different specific product - not applicable
        return -1;
      }

      // Specific reseller match
      if (rule.resellerId === input.resellerId) {
        score += 100;
      } else if (rule.resellerId !== null) {
        // Rule is for a different specific reseller - not applicable
        return -1;
      }

      // Category match
      if (rule.categoryName === input.categoryName) {
        score += 10;
      } else if (rule.categoryName !== null) {
        // Rule is for a different category - not applicable
        return -1;
      }

      // Add explicit priority value
      score += rule.priority;

      return score;
    };

    // Score and sort all rules
    const scoredRules = qualifyingRules
      .map(rule => ({
        rule,
        score: scoreRule(rule)
      }))
      .filter(item => item.score >= 0) // Remove non-applicable rules
      .sort((a, b) => b.score - a.score); // Sort by score descending

    // Return the highest scoring rule
    return scoredRules.length > 0 ? scoredRules[0].rule : null;
  }

  /**
   * Get default commission rule (platform keeps everything)
   */
  static getDefaultCommissionSplit(productPrice: number): CommissionResult {
    return {
      platformCommission: productPrice,
      resellerEarnings: 0,
      appliedRule: null,
      effectiveRate: 0
    };
  }

  /**
   * Validate commission rule configuration
   */
  static validateRule(rule: Partial<CommissionRule>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!rule.name || rule.name.trim() === '') {
      errors.push('Rule name is required');
    }

    if (!rule.commissionType) {
      errors.push('Commission type is required');
    }

    if (!rule.commissionValue || parseFloat(rule.commissionValue as any) < 0) {
      errors.push('Commission value must be a positive number');
    }

    if (rule.commissionType === 'percentage') {
      const value = parseFloat(rule.commissionValue as any);
      if (value > 100) {
        errors.push('Percentage commission cannot exceed 100%');
      }
    }

    if (rule.minOrderAmount && parseFloat(rule.minOrderAmount as any) < 0) {
      errors.push('Minimum order amount cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default CommissionService;
