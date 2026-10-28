// components/chat-widget/types.ts
export type ChatRole = "user" | "assistant" | "system";

// کارت‌های UI که بک‌اند کنار پیام می‌فرستد (فعلاً: غذای اضافه‌شده به سبد)
export interface CartItemAddedCard {
  type: "cart_item_added";
  meal_id: number;
  title: string;
  image: string | null;
  price: number;
  quantity_added: number;
  quantity_in_cart: number;
}
export type ChatCard = CartItemAddedCard;

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  cards?: ChatCard[];
  isStreaming?: boolean;
  createdAt: number;
}

export interface CheckoutInterruptData {
  type: "confirm_checkout";
  summary: string;
  total: number;
  question: string;
}

export interface RoomBookingInterruptData {
  type: "confirm_room_booking";
  room_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  total: number;
  question: string;
}

export type PendingInterrupt = CheckoutInterruptData | RoomBookingInterruptData;

export interface ChatApiMessageResponse {
  type: "message";
  content: string;
  remaining?: number | null;
  cards?: ChatCard[];
}

export interface ChatApiInterruptResponse {
  type: "interrupt";
  data: PendingInterrupt;
  remaining?: number | null;
  cards?: ChatCard[];
}

export type ChatApiResponse = ChatApiMessageResponse | ChatApiInterruptResponse;

export interface ChatUser {
  id: number;
  name: string;
  email: string;
}

// پاسخ GET /chat/history
export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: ChatCard[];
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[];
  pending: PendingInterrupt | null;
  remaining: number;
}
