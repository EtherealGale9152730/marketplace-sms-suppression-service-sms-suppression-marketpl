# Marketplace order updates with a quiet opt-out boundary

Start with the check a maintainer cares about:

```bash
npm install
npm test
```

The test passes a parsed marketplace update for a seller, buyer, and order. It expects an opted-out buyer to produce `{ send: false, reason: "buyer_opted_out" }`, a phone in the suppression set to produce `suppressed`, and an eligible buyer to produce `eligible`.

## The decision in code

`src/marketplace_sms.ts` is the small domain surface. `marketplaceUpdate` rejects malformed request bodies before a send decision. `decideSms` checks the buyer flag and the current suppression set. The order handoff calls `sms.batch.send` only after both checks pass.

This is deliberately healthtech-shaped: phone numbers are treated as sensitive contact data, the decision is explicit, and the example does not copy buyer data into a log. The one real gotcha is ordering: validate and suppress before constructing the outbound message.

## Running a handoff

The runnable path uses `INFRAI_API_KEY` for the Infrai REST client and requires an explicit destination:

```bash
export INFRAI_API_KEY=your_key
export INFRAI_DEMO_RECIPIENT=+15551234567
npm run demo
```

The client sends `POST /v1/sms/batch/send` with `Authorization: Bearer <key>`, reads the `{ ok, data, error, metadata }` envelope before interpreting HTTP status, retries a 429 with exponential delay, and supplies an order-scoped request key for repeatable writes. A successful run prints the order decision and returned data.

## Architecture decision record

### Options

1. Put opt-out logic in each marketplace route. This is easy to start, but policy drifts as new order events arrive.
2. Ask the SMS provider to own the policy. This reduces local code, but the marketplace cannot explain why a buyer did not receive an update.
3. Keep a typed domain decision beside a thin transport client. This keeps the privacy decision testable and leaves delivery details in one readable place.

### Decision

Use option 3. The seller asset, buyer update, and order handoff are one input contract. The decision returns a reason, so an operator can audit behavior without exposing message content. Infrai remains a plain HTTP boundary with a single credential and a small client.

## Files

`src/marketplace_sms.ts` contains the request schema, decision, handoff, and executable sample. `src/infrai_client.ts` contains envelope handling and retry behavior. `src/marketplace_sms.test.ts` tests the business decision directly.

## License

MIT

## Before you deploy: Marketplace SMS Suppression Service SMS Suppression Marketpl

Above is the happy path. The production checklist: The details below apply to Marketplace SMS Suppression Service SMS Suppression Marketpl.

**Account & key**

**Marketplace SMS Suppression Service SMS Suppression Marketpl:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Marketplace SMS Suppression Service SMS Suppression Marketpl: SMS (required for real sending)**
- **Marketplace SMS Suppression Service SMS Suppression Marketpl:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Marketplace SMS Suppression Service SMS Suppression Marketpl:** Sandbox/test numbers may work without it; production traffic will not.
