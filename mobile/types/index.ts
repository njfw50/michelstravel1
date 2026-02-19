// Tipos compartilhados do Flight Commission Hub Mobile

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface DashboardStats {
  todayRevenue: number;
  activeBookings: number;
  pendingCommissions: number;
  newClients: number;
  revenueChange: number; // Percentual de mudança
  bookingsChange: number;
  commissionsChange: number;
  clientsChange: number;
}

export interface RecentActivity {
  id: string;
  type: 'booking' | 'payment' | 'message' | 'escalation';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  referenceCode: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  flight: {
    id: string;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    airline: string;
    flightNumber: string;
  };
  amount: number;
  commission: number;
  status: BookingStatus;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  class: 'economy' | 'business' | 'first';
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  class?: 'economy' | 'business' | 'first';
}

export interface Payment {
  id: string;
  bookingId: string;
  customer: {
    name: string;
    email: string;
  };
  amount: number;
  method: 'credit_card' | 'pix' | 'boleto';
  status: 'pending' | 'paid' | 'refunded' | 'failed';
  stripePaymentId?: string;
  createdAt: string;
  paidAt?: string;
}

export interface Conversation {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isFromCustomer: boolean;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  isFromCustomer: boolean;
  timestamp: string;
  read: boolean;
}

export interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'message' | 'escalation' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface Escalation {
  id: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  reason: string;
  transcript: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  notes?: string;
}

export interface AnalyticsData {
  period: 'today' | 'week' | 'month' | 'year';
  revenue: {
    total: number;
    data: Array<{ date: string; value: number }>;
  };
  bookings: {
    total: number;
    byDestination: Array<{ destination: string; count: number }>;
  };
  commissions: {
    total: number;
    data: Array<{ date: string; value: number }>;
  };
  conversionRate: number;
  paymentMethods: Array<{ method: string; count: number; percentage: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface FilterOptions {
  status?: BookingStatus[];
  dateFrom?: string;
  dateTo?: string;
  destination?: string;
  searchQuery?: string;
}
