import assert from "node:assert/strict";
import { decideSms, marketplaceUpdate } from "./marketplace_sms.js";

const input = marketplaceUpdate.parse({ seller: { id: "s1", displayName: "Care Market" }, buyer: { id: "b1", phone: "+14155550123", optedOut: true }, order: { id: "o1", status: "handed_off" } });
assert.deepEqual(decideSms(input, new Set()), { send: false, reason: "buyer_opted_out" });
assert.deepEqual(decideSms({ ...input, buyer: { ...input.buyer, optedOut: false } }, new Set([input.buyer.phone])), { send: false, reason: "suppressed" });
assert.deepEqual(decideSms({ ...input, buyer: { ...input.buyer, optedOut: false } }, new Set()), { send: true, reason: "eligible" });
console.log("SMS decision test passed");
