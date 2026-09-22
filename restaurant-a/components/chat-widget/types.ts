export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** برای پیام‌های دستیار: آیا هنوز در حال تایپ (جلوه‌ی استریم) است؟ */
  isStreaming?: boolean;
  createdAt: number;
}

/** پیلود دقیق مطابق backend: app/graph/tools/order_tools.py -> request_checkout */
export interface CheckoutInterruptData {
  type: "confirm_checkout";
  summary: string;
  total: number;
  question: string;
}

export interface ChatApiMessageResponse {
  type: "message";
  content: string;
}

export interface ChatApiInterruptResponse {
  type: "interrupt";
  data: CheckoutInterruptData;
}

export type ChatApiResponse = ChatApiMessageResponse | ChatApiInterruptResponse;

export interface ChatUser {
  id: number;
  name: string;
  email: string;
}
