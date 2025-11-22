import type { CloudEvent } from '@google-cloud/functions-framework';
type FirestoreValue = {
    stringValue?: string;
    integerValue?: string;
    doubleValue?: number;
    booleanValue?: boolean;
    timestampValue?: string;
    nullValue?: null;
    mapValue?: {
        fields?: Record<string, FirestoreValue>;
    };
    arrayValue?: {
        values?: FirestoreValue[];
    };
    referenceValue?: string;
};
interface FirestoreDocument {
    name?: string;
    fields?: Record<string, FirestoreValue>;
}
interface FirestoreEventData {
    value?: FirestoreDocument;
}
type FirestoreCloudEvent = CloudEvent<FirestoreEventData>;
export declare const onProtocolLogWritten: (event: FirestoreCloudEvent) => Promise<void>;
export {};
