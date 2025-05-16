"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeIdentifier = sanitizeIdentifier;
const RESERVED_KEYWORDS = new Set([
    'module', 'fun', 'struct', 'public', 'script', 'move', 'use',
    'native', 'return', 'let', 'if', 'else', 'while', 'loop',
    'true', 'false', 'address', 'vector', 'signer', 'copy', 'borrow'
]);
function sanitizeIdentifier(name) {
    // Replace invalid characters with underscore
    let safeName = name.replace(/[^a-zA-Z0-9_]/g, '_');
    // Collapse multiple underscores to one
    safeName = safeName.replace(/_+/g, '_');
    // Trim leading/trailing underscores
    safeName = safeName.replace(/^_+|_+$/g, '');
    // Prepend underscore if it starts with a digit
    if (/^\d/.test(safeName)) {
        safeName = '_' + safeName;
    }
    // Append underscore if it’s a reserved keyword
    if (RESERVED_KEYWORDS.has(safeName)) {
        safeName = safeName + '_';
    }
    return safeName;
}
