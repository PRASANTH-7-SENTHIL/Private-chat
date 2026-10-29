export interface User {
  id: string;
  login_id: string;
  loginId?: string;
  status: 'active' | 'inactive' | 'blocked';
  created_at: string;
  createdAt?: string;
}

export interface Device {
  id: string;
  user_id: string;
  userId?: string;
  identity_public_key: string;
  identityPublicKey?: string;
  signed_prekey: string;
  signedPrekey?: string;
  signed_prekey_signature: string;
  signedPrekeySignature?: string;
  created_at: string;
  createdAt?: string;
  revoked_at: string | null;
  revokedAt?: string | null;
}

export interface KeyBundle {
  user_id: string;
  device_id: string;
  identity_public_key: string;
  signed_prekey: string;
  signed_prekey_signature: string;
  one_time_prekeys: string[];
}

export interface ConversationMember {
  user_id: string;
  login_id: string;
  joined_at: string;
  role: string;
}

export interface Conversation {
  id: string;
  conversation_type: 'direct';
  members: ConversationMember[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  client_message_id: string;
  clientMessageId?: string;
  conversation_id: string;
  conversationId?: string;
  sender_device_id: string;
  senderDeviceId?: string;
  sender_id: string;
  senderId?: string;
  sender_login_id: string;
  senderLoginId?: string;
  encrypted_payload: string;
  encryptedPayload?: string;
  protocol_version: number;
  protocolVersion?: number;
  server_sequence: number;
  serverSequence?: number;
  created_at: string;
  createdAt?: string;
  decryptedContent?: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ContactRequest {
  id: string;
  sender_id: string;
  sender_login_id: string;
  recipient_id: string;
  recipient_login_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  login_id: string;
  status: string;
  conversation_id?: string;
}

export interface WSMessage {
  type: string;
  payload: Record<string, any>;
}
