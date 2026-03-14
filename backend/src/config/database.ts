import mongoose from 'mongoose';
import logger from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || (process.env.VERCEL ? '' : 'mongodb://localhost:27017/akshaya_dairy');

// Single promise so multiple callers can await the same connection (e.g. serverless cold start)
let connectionPromise: Promise<void> | null = null;

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/** Returns a promise that resolves when MongoDB is connected (or rejects if connection fails). */
export async function connectDatabase(): Promise<void> {
  if (isConnected()) return;
  if (connectionPromise) return connectionPromise;
  if (process.env.VERCEL && !process.env.MONGODB_URI) {
    const msg = 'MONGODB_URI is not set in Vercel environment variables. Add it in Project Settings → Environment Variables.';
    logger.error(msg);
    return Promise.reject(new Error(msg));
  }
  connectionPromise = (async () => {
    try {
      await mongoose.connect(MONGODB_URI);
      logger.info('MongoDB connected');
    } catch (err) {
      logger.error('MongoDB connection error', { error: err });
      connectionPromise = null;
      throw err;
    }
  })();
  return connectionPromise;
}

// Helper: convert Mongoose doc (or lean object) to API shape with string id
export function toApiDoc(doc: mongoose.Document | Record<string, any> | null): any {
  if (!doc) return null;
  const obj = (doc as mongoose.Document).toObject ? (doc as mongoose.Document).toObject() : { ...doc };
  return { ...obj, id: obj._id?.toString?.() || obj._id, _id: obj._id?.toString?.() || obj._id };
}

export function toApiDocs(docs: mongoose.Document[]): any[] {
  return docs.map((d) => toApiDoc(d)!);
}

export default { connectDatabase, toApiDoc, toApiDocs };
