"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRevenueCatWebhook = handleRevenueCatWebhook;
const node_crypto_1 = __importDefault(require("node:crypto"));
const config_1 = require("./config");
const supabaseClient_1 = require("./supabaseClient");
const CORE_ENTITLEMENTS = new Set(['core']);
const CORE_PRODUCT_IDS = new Set(['core_monthly', 'core_annual', 'core_yearly']);
const ACTIVATING_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION']);
const CANCELLATION_EVENTS = new Set(['CANCELLATION', 'BILLING_ISSUE', 'EXPIRATION', 'SUBSCRIPTION_PAUSED']);
function getRawBody(req) {
    if (req.rawBody) {
        return req.rawBody;
    }
    if (!req.body) {
        return Buffer.from('', 'utf8');
    }
    return Buffer.from(JSON.stringify(req.body), 'utf8');
}
function extractSignature(req) {
    const signatureHeader = req.headers['x-revenuecat-signature'] ?? req.headers['X-Revenuecat-Signature'];
    if (!signatureHeader || Array.isArray(signatureHeader)) {
        return null;
    }
    return signatureHeader.trim();
}
function isValidSignature(payload, signature, secret) {
    try {
        const expected = node_crypto_1.default.createHmac('sha256', secret).update(payload).digest('base64');
        const expectedBuffer = Buffer.from(expected, 'utf8');
        const providedBuffer = Buffer.from(signature, 'utf8');
        if (expectedBuffer.length !== providedBuffer.length) {
            return false;
        }
        return node_crypto_1.default.timingSafeEqual(expectedBuffer, providedBuffer);
    }
    catch (error) {
        console.error('Failed to verify RevenueCat webhook signature', error);
        return false;
    }
}
function normalizeIdentifier(value) {
    return value ? value.toLowerCase() : null;
}
function isCoreEvent(event) {
    if (!event) {
        return false;
    }
    if (event.entitlement_ids && event.entitlement_ids.some((id) => CORE_ENTITLEMENTS.has(id.toLowerCase()))) {
        return true;
    }
    const offering = normalizeIdentifier(event.presented_offering_id);
    if (offering && CORE_ENTITLEMENTS.has(offering)) {
        return true;
    }
    const productId = normalizeIdentifier(event.product_id);
    if (productId && CORE_PRODUCT_IDS.has(productId)) {
        return true;
    }
    return false;
}
function resolveSubscriptionId(event) {
    if (!event) {
        return null;
    }
    return event.transaction_id ?? event.original_transaction_id ?? event.id ?? null;
}
async function handleRevenueCatWebhook(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    const { revenuecatWebhookSecret } = (0, config_1.getConfig)();
    const rawBody = getRawBody(req);
    const signature = extractSignature(req);
    if (!signature || !isValidSignature(rawBody, signature, revenuecatWebhookSecret)) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
    }
    const payload = req.body;
    const event = payload?.event;
    if (!event || !event.app_user_id || !event.type) {
        res.status(400).json({ error: 'Invalid webhook payload' });
        return;
    }
    if (!isCoreEvent(event)) {
        res.status(202).json({ ignored: true });
        return;
    }
    const supabase = (0, supabaseClient_1.getServiceClient)();
    const userId = event.app_user_id;
    const subscriptionId = resolveSubscriptionId(event);
    try {
        if (ACTIVATING_EVENTS.has(event.type)) {
            const { error } = await supabase
                .from('users')
                .update({ tier: 'core', subscription_id: subscriptionId })
                .eq('id', userId)
                .select('id')
                .maybeSingle();
            if (error) {
                throw error;
            }
            res.status(200).json({ acknowledged: true });
            return;
        }
        if (CANCELLATION_EVENTS.has(event.type)) {
            const { error } = await supabase
                .from('users')
                .update({ tier: 'free', subscription_id: null })
                .eq('id', userId)
                .select('id')
                .maybeSingle();
            if (error) {
                throw error;
            }
            res.status(200).json({ acknowledged: true });
            return;
        }
        res.status(202).json({ ignored: true });
    }
    catch (error) {
        console.error('Failed to process RevenueCat webhook', error);
        res.status(500).json({ error: 'Failed to update subscription status' });
    }
}
