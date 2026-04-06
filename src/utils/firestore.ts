/**
 * Recursively removes `undefined` values from an object or array.
 * Firestore does not support `undefined` values.
 */
export function sanitizeForFirestore(data: any): any {
  if (data === undefined) return null;
  if (data === null) return null;
  
  // Handle Firestore FieldValue and Timestamp
  if (data && typeof data === 'object' && (data.constructor.name === 'FieldValue' || data.constructor.name === 'Timestamp' || data._methodName === 'serverTimestamp')) {
    return data;
  }

  if (data instanceof Date) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item));
  }
  
  if (typeof data === 'object') {
    // Check if it's a plain object
    if (data.constructor && data.constructor.name !== 'Object') {
      return data;
    }
    
    const sanitized: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        if (value !== undefined) {
          sanitized[key] = sanitizeForFirestore(value);
        }
      }
    }
    return sanitized;
  }
  
  return data;
}
