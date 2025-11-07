/**
 * Utility functions for handling BigInt serialization
 */

// Helper to convert Prisma types to JSON-serializable formats
const serializePrismaTypes = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  // Handle BigInt
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  // Handle Decimal (Prisma Decimal type)
  if (obj && typeof obj === 'object' && (obj.constructor.name === 'Decimal' || obj.constructor.name === 'i')) {
    return obj.toJSON ? obj.toJSON() : parseFloat(obj.toString());
  }
  
  // Handle Date
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(serializePrismaTypes);
  }
  
  // Handle Objects
  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = serializePrismaTypes(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
};

// Express middleware to handle Prisma type serialization
const bigIntMiddleware = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    const serializedData = serializePrismaTypes(data);
    return originalJson.call(this, serializedData);
  };
  
  next();
};

module.exports = {
  serializePrismaTypes,
  bigIntMiddleware
};