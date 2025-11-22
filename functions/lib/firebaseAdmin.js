"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirebaseApp = getFirebaseApp;
exports.verifyFirebaseToken = verifyFirebaseToken;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const config_1 = require("./config");
let app = null;
function getFirebaseApp() {
    if (app) {
        return app;
    }
    const config = (0, config_1.getConfig)();
    app = firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert({
            projectId: config.firebaseProjectId,
            clientEmail: config.firebaseClientEmail,
            privateKey: config.firebasePrivateKey
        })
    });
    return app;
}
async function verifyFirebaseToken(idToken) {
    const firebaseApp = getFirebaseApp();
    return firebaseApp.auth().verifyIdToken(idToken);
}
