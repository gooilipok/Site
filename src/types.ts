export type UserRole = 'customer' | 'admin';
export type AccountStatus = 'active' | 'banned' | 'deleted';

export interface UserAgreementConsents {
  terms_accepted: boolean;
  terms_accepted_at?: string;
  privacy_accepted: boolean;
  privacy_accepted_at?: string;
  consent_accepted: boolean;
  consent_accepted_at?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  account_status: AccountStatus;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  agreements: UserAgreementConsents;
  order_count?: number;
}

export type OrderStatus = 'new' | 'assigned' | 'in_progress' | 'revision' | 'rework' | 'completed' | 'closed' | 'cancelled';

export interface OrderFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded_at: string;
}

export interface Order {
  id: string;
  title: string; // Subject / Title
  description: string;
  deadline: string;
  price?: string; // Legacy / Display price
  client_price?: string; // Цена для клиента (payments.client_price)
  executer_price?: string; // Цена для исполнителя (payments.executer_price)
  contact: string;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
  user_id: string;
  user_email: string;
  user_username: string;
  files: OrderFile[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AgreementDocument {
  id: 'terms' | 'privacy' | 'consent';
  title: string;
  version: string;
  last_updated: string;
  sections: {
    heading: string;
    content: string;
  }[];
}

export interface CookiePreferences {
  accepted: boolean;
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  saved_at: string;
}

export interface AdminStats {
  total_users: number;
  total_orders: number;
  orders_new: number;
  orders_in_progress: number;
  orders_revision: number;
  orders_completed: number;
  orders_cancelled: number;
  telegram_bot_connected: boolean;
  smtp_status: string;
  system_uptime: string;
  telegram_recent_logs?: { id: string; timestamp: string; text: string }[];
}

export interface CreateOrderPayload {
  title: string;
  description: string;
  deadline: string;
  price?: string;
  contact: string;
  files?: File[];
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  consent_accepted: boolean;
}
