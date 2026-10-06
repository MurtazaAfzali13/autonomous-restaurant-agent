// components/chat-widget/types.ts
export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
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
}

export interface ChatApiInterruptResponse {
  type: "interrupt";
  data: PendingInterrupt;
}

export type ChatApiResponse = ChatApiMessageResponse | ChatApiInterruptResponse;

export interface ChatUser {
  id: number;
  name: string;
  email: string;
}