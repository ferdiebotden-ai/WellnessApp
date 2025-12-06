"use strict";
/**
 * Crisis Detection Rules
 *
 * Defines crisis keywords with severity levels and contextual exclusions,
 * plus mental health resources to surface when crisis is detected.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRISIS_RESOURCES = exports.CRISIS_KEYWORDS = void 0;
exports.getResourcesForSeverity = getResourcesForSeverity;
exports.getHighestSeverity = getHighestSeverity;
exports.getUniqueSeverities = getUniqueSeverities;
const types_1 = require("./types");
/**
 * Crisis keywords organized by severity level.
 * Each keyword has optional exclusion patterns to prevent false positives.
 */
exports.CRISIS_KEYWORDS = [
    // HIGH SEVERITY - Immediate risk to life
    {
        phrase: 'suicide',
        severity: 'high',
        exclusions: [
            'suicide squad',
            'suicide awareness',
            'suicide prevention',
            'suicide hotline',
            'prevent suicide',
        ],
    },
    {
        phrase: 'suicidal',
        severity: 'high',
        exclusions: ['suicidal ideation awareness', 'prevent suicidal'],
    },
    {
        phrase: 'kill myself',
        severity: 'high',
        exclusions: ['kill myself laughing', 'kill myself with kindness'],
    },
    {
        phrase: 'end my life',
        severity: 'high',
        exclusions: [],
    },
    {
        phrase: "don't want to live",
        severity: 'high',
        exclusions: [],
    },
    {
        phrase: 'dont want to live',
        severity: 'high',
        exclusions: [],
    },
    {
        phrase: 'want to die',
        severity: 'high',
        exclusions: [
            'want to die laughing',
            'want to die of laughter',
            'want to die from',
            'want to die when',
        ],
    },
    {
        phrase: 'overdose',
        severity: 'high',
        exclusions: [
            'caffeine overdose',
            'sugar overdose',
            'information overdose',
            'vitamin overdose',
            'supplement overdose',
        ],
    },
    // MEDIUM SEVERITY - Self-harm
    {
        phrase: 'self-harm',
        severity: 'medium',
        exclusions: ['prevent self-harm', 'self-harm awareness'],
    },
    {
        phrase: 'self harm',
        severity: 'medium',
        exclusions: ['prevent self harm', 'self harm awareness'],
    },
    {
        phrase: 'cutting',
        severity: 'medium',
        exclusions: [
            'cutting calories',
            'cutting carbs',
            'cutting workout',
            'cutting edge',
            'cutting back',
            'cutting down',
            'cutting out',
            'cutting sugar',
            'cutting fat',
            'cutting weight',
            'cutting phase',
            'cutting season',
        ],
    },
    {
        phrase: 'hurt myself',
        severity: 'medium',
        exclusions: [
            'hurt myself at the gym',
            'hurt myself working out',
            'hurt myself exercising',
            'hurt myself running',
            'hurt myself lifting',
            'hurt myself training',
            'hurt myself playing',
        ],
    },
    {
        phrase: 'harming myself',
        severity: 'medium',
        exclusions: [],
    },
    // LOW SEVERITY - Eating disorders
    {
        phrase: 'eating disorder',
        severity: 'low',
        exclusions: ['eating disorder recovery', 'overcome eating disorder'],
    },
    {
        phrase: 'anorexia',
        severity: 'low',
        exclusions: ['anorexia recovery', 'overcome anorexia'],
    },
    {
        phrase: 'bulimia',
        severity: 'low',
        exclusions: ['bulimia recovery', 'overcome bulimia'],
    },
    {
        phrase: 'purging',
        severity: 'low',
        exclusions: [
            'purging toxins',
            'purging clutter',
            'purging old',
            'purging files',
            'purging data',
            'purging my closet',
        ],
    },
    {
        phrase: 'binge eating',
        severity: 'low',
        exclusions: ['binge eating recovery', 'overcome binge eating'],
    },
];
/**
 * Mental health crisis resources, ordered by priority.
 * Resources are filtered by severity level when displayed.
 */
exports.CRISIS_RESOURCES = [
    {
        name: '988 Suicide & Crisis Lifeline',
        description: '24/7 free and confidential support for people in distress',
        contact: 'Call or text 988',
        type: 'hotline',
        forSeverities: ['high', 'medium', 'low'],
        priority: 1,
    },
    {
        name: 'Crisis Text Line',
        description: 'Free, 24/7, confidential text-based crisis support',
        contact: 'Text HOME to 741741',
        type: 'text',
        forSeverities: ['high', 'medium', 'low'],
        priority: 2,
    },
    {
        name: 'SAMHSA National Helpline',
        description: 'Substance Abuse and Mental Health Services Administration',
        contact: 'Call 1-800-662-4357',
        type: 'hotline',
        forSeverities: ['high', 'medium'],
        priority: 3,
    },
    {
        name: 'International Association for Suicide Prevention',
        description: 'Find a crisis center in your country',
        contact: 'https://www.iasp.info/resources/Crisis_Centres/',
        type: 'website',
        forSeverities: ['high', 'medium'],
        priority: 4,
    },
    {
        name: 'NEDA Helpline',
        description: 'National Eating Disorders Association support and resources',
        contact: 'Call 1-800-931-2237',
        type: 'hotline',
        forSeverities: ['low'],
        priority: 3,
    },
    {
        name: 'NEDA Chat',
        description: 'Online chat with NEDA helpline counselors',
        contact: 'https://www.nationaleatingdisorders.org/help-support/contact-helpline',
        type: 'chat',
        forSeverities: ['low'],
        priority: 4,
    },
];
/**
 * Get crisis resources appropriate for the given severity level.
 * Resources are sorted by priority (lower = shown first).
 *
 * @param severity - The severity level to filter resources by
 * @param limit - Maximum number of resources to return (optional)
 * @returns Array of CrisisResource objects
 */
function getResourcesForSeverity(severity, limit) {
    const filtered = exports.CRISIS_RESOURCES.filter((r) => r.forSeverities.includes(severity)).sort((a, b) => a.priority - b.priority);
    return limit ? filtered.slice(0, limit) : filtered;
}
/**
 * Determine the highest severity from an array of severity levels.
 *
 * @param severities - Array of CrisisSeverity values
 * @returns The highest severity, or null if array is empty
 */
function getHighestSeverity(severities) {
    if (severities.length === 0) {
        return null;
    }
    return severities.reduce((highest, current) => types_1.SEVERITY_PRIORITY[current] > types_1.SEVERITY_PRIORITY[highest] ? current : highest);
}
/**
 * Get all unique severities from an array of keywords.
 *
 * @param keywords - Array of CrisisKeyword objects
 * @returns Array of unique CrisisSeverity values
 */
function getUniqueSeverities(keywords) {
    return [...new Set(keywords.map((k) => k.severity))];
}
