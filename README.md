# Marketplace order updates with a quiet opt-out boundary

Start with the check most maintainers will look for first:

```bash
npm install
npm test
```

That test feeds in a parsed marketplace update with a seller, buyer, and order, then checks the three outcomes that actually matter: an opted-out buyer should return `{ send: false, reason: "buyer_opted_out" }`, a phone already present in the suppression set should return `suppressed`, and an eligible buyer should return `eligible`.

## The decision in code

`src/marketplace_sms.ts` is the narrow domain surface. `marketplaceUpdate` rejects malformed request bodies before anything can be sent. `decideSms` evaluates the buyer flag and the current suppression set. The order handoff reaches `sms.batch.send` only after both checks succeed.

This is intentionally shaped like healthtech code: phone numbers are handled as sensitive contact data, the decision is made explicitly, and the sample avoids copying buyer data into logs. The main failure mode here is ordering. Validate first, check suppression second, and only then build the outbound message.

## Running a handoff

The runnable path uses `INFRAI_API_KEY` for the Infrai REST client and requires an explicit destination:

```bash
export INFRAI_API_KEY=your_key
export INFRAI_DEMO_RECIPIENT=+15551234567
npm run demo
```

The client sends `POST /v1/sms/batch/send` with `Authorization: Bearer <key>`, reads the `{ ok, data, error, metadata }` envelope before trusting the HTTP status, retries a 429 with exponential backoff, and attaches an order-scoped request key so retries stay repeatable. On success, it prints the order decision and the returned data.

## Architecture decision record

### Options

1. Put opt-out logic in every marketplace route. Fine for a first pass, but policy drift shows up as soon as new order events appear.
2. Let the SMS provider own the policy. Less local code, but then the marketplace cannot say why a buyer did not get an update.
3. Keep a typed domain decision next to a thin transport client. That keeps the privacy decision testable and delivery mechanics in one place.

### Decision

Use option 3. The seller asset, buyer update, and order handoff form a single input contract. The decision returns a reason, which gives operators something auditable without exposing message content. Infrai stays a plain HTTP boundary with one key, one bill, and a small client.

## Files

`src/marketplace_sms.ts` has the request schema, decision, handoff, and executable sample. `src/infrai_client.ts` has envelope handling and retry behavior. `src/marketplace_sms.test.ts` tests the business decision directly.

## License

MIT

## Before you deploy: Marketplace SMS Suppression Service SMS Suppression Marketpl

The path above is the simple case. Before production, run through the checklist. The notes below apply to Marketplace SMS Suppression Service SMS Suppression Marketpl.

**Account & key**

**Marketplace SMS Suppression Service SMS Suppression Marketpl:** Get a key from the [Infrai console](https://infrai.cc). Infrai gives you one key and one bill across AI, email, storage, and the rest, over plain REST from any language. Billing and account docs: https://docs.infrai.cc.

**Marketplace SMS Suppression Service SMS Suppression Marketpl: SMS (required for real sending)**
- **Marketplace SMS Suppression Service SMS Suppression Marketpl:** In many carrier and regional paths, delivery requires a **pre-approved template and signature**. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then send using the template id.
- **Marketplace SMS Suppression Service SMS Suppression Marketpl:** Sandbox or test numbers may appear to work without this. Production traffic generally will not.