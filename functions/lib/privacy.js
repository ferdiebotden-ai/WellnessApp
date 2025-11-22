"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePubSubPayload = exports.getStorageClient = exports.getPubSubClient = exports.handleUserDeletionJob = exports.handleUserExportJob = exports.deliverExportEmail = exports.getPrivacyDashboardData = exports.requestUserDeletion = exports.requestUserDataExport = void 0;
const pubsub_1 = require("@google-cloud/pubsub");
const storage_1 = require("@google-cloud/storage");
const jszip_1 = __importDefault(require("jszip"));
const users_1 = require("./users");
const config_1 = require("./config");
const supabaseClient_1 = require("./supabaseClient");
const firebaseAdmin_1 = require("./firebaseAdmin");
let cachedPubSub = null;
let cachedStorage = null;
const getPubSubClient = () => {
    if (!cachedPubSub) {
        cachedPubSub = new pubsub_1.PubSub();
    }
    return cachedPubSub;
};
exports.getPubSubClient = getPubSubClient;
const getStorageClient = () => {
    if (!cachedStorage) {
        cachedStorage = new storage_1.Storage();
    }
    return cachedStorage;
};
exports.getStorageClient = getStorageClient;
const parsePubSubPayload = (data) => {
    if (!data) {
        throw new Error('Missing pubsub data payload');
    }
    const buffer = typeof data === 'string' ? Buffer.from(data, 'base64') : data;
    const parsed = JSON.parse(buffer.toString('utf8'));
    return parsed;
};
exports.parsePubSubPayload = parsePubSubPayload;
const buildErrorResponse = (error) => {
    if (typeof error === 'object' && error !== null) {
        const maybeStatus = error.status;
        if (typeof maybeStatus === 'number') {
            return { status: maybeStatus, message: error.message };
        }
    }
    return { status: 500, message: error instanceof Error ? error.message : 'Unexpected server error' };
};
const requestUserDataExport = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { uid, email } = await (0, users_1.authenticateRequest)(req);
        const config = (0, config_1.getConfig)();
        const privacyConfig = (0, config_1.getPrivacyConfig)();
        const message = {
            userId: uid,
            email: email ?? null,
            requestedAt: new Date().toISOString(),
        };
        await getPubSubClient().topic(privacyConfig.exportTopic).publishMessage({ json: message });
        res.status(202).json({ accepted: true });
    }
    catch (error) {
        const { status, message } = buildErrorResponse(error);
        res.status(status).json({ error: message });
    }
};
exports.requestUserDataExport = requestUserDataExport;
const requestUserDeletion = async (req, res) => {
    if (req.method !== 'DELETE') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { uid, email } = await (0, users_1.authenticateRequest)(req);
        const config = (0, config_1.getConfig)();
        const privacyConfig = (0, config_1.getPrivacyConfig)();
        const message = {
            userId: uid,
            email: email ?? null,
            requestedAt: new Date().toISOString(),
        };
        await getPubSubClient().topic(privacyConfig.deletionTopic).publishMessage({ json: message });
        res.status(202).json({ accepted: true });
    }
    catch (error) {
        const { status, message } = buildErrorResponse(error);
        res.status(status).json({ error: message });
    }
};
exports.requestUserDeletion = requestUserDeletion;
const getPrivacyDashboardData = async (req, res) => {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { uid } = await (0, users_1.authenticateRequest)(req);
        const supabase = (0, supabaseClient_1.getUserClient)(uid);
        const [protocolLogs, aiAudit] = await Promise.all([
            supabase
                .from('protocol_logs')
                .select('id, protocol_id, module_id, status, logged_at, metadata')
                .eq('user_id', uid)
                .order('logged_at', { ascending: false })
                .limit(100),
            supabase
                .from('ai_audit_log')
                .select('id, action, agent, model, summary, created_at, metadata')
                .eq('user_id', uid)
                .order('created_at', { ascending: false })
                .limit(100),
        ]);
        if (protocolLogs.error) {
            throw protocolLogs.error;
        }
        if (aiAudit.error) {
            throw aiAudit.error;
        }
        const sanitizedProtocolLogs = (protocolLogs.data ?? []).map((entry) => ({
            id: entry.id,
            protocol_id: entry.protocol_id,
            protocolName: null,
            module_id: entry.module_id,
            status: entry.status,
            logged_at: entry.logged_at,
            metadata: entry.metadata ?? null,
        }));
        const sanitizedAuditLog = (aiAudit.data ?? []).map((entry) => ({
            id: entry.id,
            action: entry.action,
            agent: entry.agent,
            model: entry.model,
            summary: entry.summary,
            created_at: entry.created_at,
            metadata: entry.metadata ?? null,
        }));
        res.status(200).json({ protocolLogs: sanitizedProtocolLogs, aiAuditLog: sanitizedAuditLog });
    }
    catch (error) {
        const { status, message } = buildErrorResponse(error);
        res.status(status).json({ error: message });
    }
};
exports.getPrivacyDashboardData = getPrivacyDashboardData;
const deliverExportEmail = async (recipient, downloadUrl) => {
    // In production this should send through the transactional email provider configured via Mission 023.
    console.info('Delivering privacy export email', { recipient, downloadUrl });
};
exports.deliverExportEmail = deliverExportEmail;
const persistArchiveToStorage = async (userId, archive) => {
    const config = (0, config_1.getConfig)();
    const privacyConfig = (0, config_1.getPrivacyConfig)();
    const storage = getStorageClient();
    const filePath = `exports/${userId}/${Date.now()}-privacy-export.zip`;
    const bucket = storage.bucket(privacyConfig.exportBucket);
    const file = bucket.file(filePath);
    await file.save(archive, {
        resumable: false,
        contentType: 'application/zip',
        metadata: {
            metadata: {
                userId,
            },
        },
    });
    const expires = Date.now() + config.privacyExportUrlTtlHours * 60 * 60 * 1000;
    const [signedUrl] = await file.getSignedUrl({ action: 'read', expires });
    return { filePath, signedUrl };
};
const fetchUserDataset = async (userId) => {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    const [protocolLogs, aiAudit, wearableArchive] = await Promise.all([
        supabase
            .from('protocol_logs')
            .select('*')
            .eq('user_id', userId)
            .order('logged_at', { ascending: false }),
        supabase
            .from('ai_audit_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        supabase
            .from('wearable_data_archive')
            .select('*')
            .eq('user_id', userId)
            .order('recorded_at', { ascending: false }),
    ]);
    if (protocolLogs.error) {
        throw protocolLogs.error;
    }
    if (aiAudit.error) {
        throw aiAudit.error;
    }
    if (wearableArchive.error) {
        throw wearableArchive.error;
    }
    return {
        protocolLogs: protocolLogs.data ?? [],
        aiAuditLog: aiAudit.data ?? [],
        wearableArchive: wearableArchive.data ?? [],
    };
};
const handleUserExportJob = async (event) => {
    const payload = parsePubSubPayload(event.message?.data);
    const dataset = await fetchUserDataset(payload.userId);
    const archive = new jszip_1.default();
    archive.file('protocol_logs.json', JSON.stringify(dataset.protocolLogs, null, 2));
    archive.file('ai_audit_log.json', JSON.stringify(dataset.aiAuditLog, null, 2));
    archive.file('wearable_archive.json', JSON.stringify(dataset.wearableArchive, null, 2));
    const buffer = await archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const { signedUrl } = await persistArchiveToStorage(payload.userId, buffer);
    if (payload.email) {
        await (0, exports.deliverExportEmail)(payload.email, signedUrl);
    }
};
exports.handleUserExportJob = handleUserExportJob;
const purgeFirestoreData = async (firestore, userId) => {
    const logQueueRef = firestore.collection('protocol_log_queue').doc(userId).collection('entries');
    const queueDocuments = await logQueueRef.listDocuments();
    await Promise.all(queueDocuments.map((doc) => doc.delete()));
    await firestore.collection('protocol_log_queue').doc(userId).delete().catch(() => undefined);
    await firestore.collection('users').doc(userId).delete().catch(() => undefined);
};
const purgeSupabaseData = async (userId) => {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    const deletionTargets = [
        { table: 'ai_audit_log', column: 'user_id' },
        { table: 'protocol_logs', column: 'user_id' },
        { table: 'wearable_data_archive', column: 'user_id' },
        { table: 'module_enrollment', column: 'user_id' },
        { table: 'users', column: 'id' },
    ];
    for (const target of deletionTargets) {
        const { error } = await supabase.from(target.table).delete().eq(target.column, userId);
        if (error) {
            throw error;
        }
    }
};
const handleUserDeletionJob = async (event) => {
    const payload = parsePubSubPayload(event.message?.data);
    await purgeSupabaseData(payload.userId);
    const firebaseApp = (0, firebaseAdmin_1.getFirebaseApp)();
    const auth = firebaseApp.auth();
    const firestore = firebaseApp.firestore();
    await purgeFirestoreData(firestore, payload.userId);
    try {
        await auth.deleteUser(payload.userId);
    }
    catch (error) {
        if (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'auth/user-not-found') {
            // User already removed; ignore.
        }
        else {
            throw error;
        }
    }
};
exports.handleUserDeletionJob = handleUserDeletionJob;
