export interface SalvyNumber {
  id: string;
  number: string;
  country: string;
  city: string;
  state: string;
  areaCode: string;
  type: 'mobile' | 'landline' | 'toll-free';
  capabilities: string[];
  monthlyPrice: number;
  setupPrice: number;
  available: boolean;
  alias?: string;
  status?: 'active' | 'inactive' | 'pending';
  connectedInstance?: string;
}

export interface WAHAInstance {
  id: string;
  name: string;
  number?: string;
  numberId?: string;
  status: 'connected' | 'disconnected' | 'qr_code' | 'error' | 'connecting';
  qrCode?: string;
  webhookUrl?: string;
  apiKey?: string;
  createdAt?: string;
  lastSeen?: string;
  messagesCount?: number;
  metadata?: any;
}

export interface PortabilityRequest {
  id: string;
  currentNumber: string;
  currentCarrier: string;
  ownerDocument: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  completedAt?: string;
  notes?: string;
}