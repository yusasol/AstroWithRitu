export type PaymentCheckout = { bookingId: string; amountMinor: number; currency: "INR"; returnUrl: string };
export type PaymentCheckoutResult = { provider: string; checkoutUrl: string; providerReference: string };
export type MeetingRequest = { bookingId: string; title: string; startsAt: string; durationMinutes: number; participantEmail: string };
export type MeetingResult = { provider: string; meetingUrl: string; providerReference: string };

/** Provider adapters keep payment vendor details out of booking and UI modules. */
export interface PaymentProvider {
  createCheckout(input: PaymentCheckout): Promise<PaymentCheckoutResult>;
  verifyWebhook(request: Request): Promise<{ providerReference: string; status: "PAID" | "FAILED" | "REFUNDED" }>;
}

/** Meeting providers can be added without changing the booking request contract. */
export interface MeetingProvider {
  createMeeting(input: MeetingRequest): Promise<MeetingResult>;
  cancelMeeting(providerReference: string): Promise<void>;
}

/** Real-time chat is planned as a separate transport/provider boundary. */
export interface RealtimeMessagingProvider {
  createConversation(bookingId: string): Promise<{ conversationId: string }>;
  createAccessToken(conversationId: string, participantId: string): Promise<string>;
}
