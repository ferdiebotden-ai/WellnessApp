"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserClient = getUserClient;
exports.getServiceClient = getServiceClient;
exports.signSupabaseAccessToken = signSupabaseAccessToken;
const supabase_js_1 = require("@supabase/supabase-js");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
let serviceClient = null;
function getServiceClient() {
    if (!serviceClient) {
        const config = (0, config_1.getConfig)();
        serviceClient = (0, supabase_js_1.createClient)(config.supabaseUrl, config.supabaseServiceRoleKey, {
            auth: {
                persistSession: false
            }
        });
    }
    return serviceClient;
}
function signSupabaseAccessToken(uid) {
    const config = (0, config_1.getConfig)();
    const payload = {
        sub: uid,
        role: 'authenticated',
        aud: 'authenticated'
    };
    return jsonwebtoken_1.default.sign(payload, config.supabaseJwtSecret, {
        issuer: 'supabase/auth/v1',
        expiresIn: '1h'
    });
}
function getUserClient(uid) {
    const config = (0, config_1.getConfig)();
    const supabaseJwt = signSupabaseAccessToken(uid);
    return (0, supabase_js_1.createClient)(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
            persistSession: false,
            detectSessionInUrl: false
        },
        global: {
            headers: {
                Authorization: `Bearer ${supabaseJwt}`
            }
        }
    });
}
