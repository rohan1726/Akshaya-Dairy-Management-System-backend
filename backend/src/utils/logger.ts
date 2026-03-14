import winston from 'winston';
import path from 'path';

const logLevel = process.env.LOG_LEVEL || 'info';
const isVercel = Boolean(process.env.VERCEL);

// On Vercel serverless, filesystem is read-only — use Console only to avoid FUNCTION_INVOCATION_FAILED
const transports: winston.transport[] = [];
if (!isVercel) {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
    })
  );
}
// Always use Console so logs appear in Vercel Runtime Logs and locally
transports.push(
  new winston.transports.Console({
    format:
      process.env.NODE_ENV === 'production' && !isVercel
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  })
);

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'akshaya-dairy' },
  transports,
});

export default logger;

