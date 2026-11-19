import { z } from "zod";
import { sendSmsBatch } from "./infrai_client.js";

export const marketplaceUpdate = z.object({
  seller: z.object({ id: z.string().min(1), displayName: z.string().min(1) }),
  buyer: z.object({ id: z.string().min(1), phone: z.string().regex(/^\+[1-9]\d{7,14}$/), optedOut: z.boolean() }),
  order: z.object({ id: z.string().min(1), status: z.enum(["paid", "packed", "handed_off"]) })
});
export type MarketplaceUpdate = z.infer<typeof marketplaceUpdate>;

export function decideSms(update: MarketplaceUpdate, suppressedPhones: ReadonlySet<string>) {
  const phoneSuppressed = suppressedPhones.has(update.buyer.phone);
  if (update.buyer.optedOut || phoneSuppressed) return { send: false as const, reason: update.buyer.optedOut ? "buyer_opted_out" : "suppressed" };
  return { send: true as const, reason: "eligible" };
}

export async function handoff(update: MarketplaceUpdate, suppressedPhones: ReadonlySet<string>) {
  const decision = decideSms(update, suppressedPhones);
  if (!decision.send) return { decision, orderId: update.order.id };
  const data = await sendSmsBatch({ messages: [{ to: update.buyer.phone, body: `Order ${update.order.id} from ${update.seller.displayName} is ${update.order.status}.` }], idempotency_key: `marketplace-order-${update.order.id}` }, `marketplace-order-${update.order.id}`);
  return { decision, orderId: update.order.id, data };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const recipient = process.env.INFRAI_DEMO_RECIPIENT;
  if (!recipient) throw new Error("INFRAI_DEMO_RECIPIENT is required");
  const input = marketplaceUpdate.parse({ seller: { id: "seller-7", displayName: "North Clinic Market" }, buyer: { id: "buyer-4", phone: recipient, optedOut: false }, order: { id: "order-42", status: "handed_off" } });
  const result = await handoff(input, new Set());
  console.log(JSON.stringify(result));
}
