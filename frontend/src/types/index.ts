/**
 * Shared TypeScript types across the StadiumIQ application.
 * Single source of truth — import from here instead of inlining inline types.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = 'fan' | 'ops';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider: 'mongo' | 'google';
  avatar?: string;
}

// ─── Match Centre ─────────────────────────────────────────────────────────────

export type MatchStatus = 'upcoming' | 'live' | 'halftime' | 'completed';

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty';
  team: 'home' | 'away';
  player: string;
  description?: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;   // emoji flag
  awayFlag: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  minute?: number;    // current minute if live
  kickoffUtc: string; // ISO string
  venue: string;
  group?: string;
  round: string;      // e.g. "Group Stage", "Quarter-Final"
  events: MatchEvent[];
}

// ─── Food Ordering ────────────────────────────────────────────────────────────

export type FoodCategory = 'mains' | 'snacks' | 'drinks' | 'desserts' | 'halal' | 'vegan';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;       // in INR (₹) for Razorpay
  priceDisplay: string;
  category: FoodCategory;
  tags: string[];      // e.g. ['halal', 'gluten-free', 'spicy']
  emoji: string;
  available: boolean;
  prepTime: number;    // minutes
  stand: string;       // e.g. "Food Stand 1 – South Concourse"
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface FoodOrder {
  id: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  collectionPoint: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

// ─── Razorpay ─────────────────────────────────────────────────────────────────

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

// ─── Operations / Telemetry (re-exported from routing for convenience) ────────

export interface QueueItem {
  gateId: string;
  name: string;
  queue: number;
  throughput: string;
  predictedWait: string;
  status: 'OK' | 'WARNING' | 'CRITICAL';
}

export interface IncidentItem {
  id: string;
  category: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  location: string;
  assignedTo: string;
  status: string;
  timestamp: string;
}

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  mitigation: string;
  type: string;
  acknowledged: boolean;
  timestamp: string;
}
