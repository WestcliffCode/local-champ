/**
 * Shared TypeScript interfaces for LocalGem.
 *
 * Phase 1 expands these by introspecting Drizzle schemas — the hand-written
 * types here are temporary and will be replaced with `InferSelectModel<typeof ...>`.
 */

export type BusinessStatus = 'unverified' | 'verified' | 'premium';
export type RedemptionStatus = 'pending' | 'completed';
export type ScoutBadge = 'none' | 'bronze' | 'silver' | 'gold';

export interface Business {
  id: string;
  name: string;
  slug: string;
  citySlug: string;
  categorySlug: string;
  status: BusinessStatus;
  isFranchise: boolean;
  cpsScore: number;
  localLoopScore: number;
  starRating?: number;
  reviewCount?: number;
}

export interface Scout {
  id: string;
  email: string;
  badgeStatus: ScoutBadge;
}

export interface Coupon {
  id: string;
  businessId: string;
  title: string;
  description: string;
  discountValue: string;
  terms: string;
  isActive: boolean;
}

export interface Redemption {
  id: string;
  couponId: string;
  scoutId: string;
  status: RedemptionStatus;
  createdAt: Date;
}

export interface Sourcing {
  id: string;
  buyerId: string;
  sellerId: string;
  verified: boolean;
}
