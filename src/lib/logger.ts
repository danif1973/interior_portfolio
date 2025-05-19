import { NextRequest } from 'next/server';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  requestId?: string;
  ip?: string;
  path?: string;
  method?: string;
}

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /key/i,
  /secret/i,
  /authorization/i,
  /cookie/i,
];

// Redact sensitive data from log entries
function redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...data };
  
  for (const [key, value] of Object.entries(redacted)) {
    if (typeof value === 'string') {
      // Check if the key matches any sensitive patterns
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
        redacted[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively redact nested objects
      redacted[key] = redactSensitiveData(value as Record<string, unknown>);
    }
  }
  
  return redacted;
}

// Generate a unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Extract request metadata
function extractRequestMetadata(request?: NextRequest): Partial<LogEntry> {
  if (!request) return {};
  
  return {
    requestId: request.headers.get('x-request-id') || generateRequestId(),
    ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    path: request.nextUrl.pathname,
    method: request.method,
  };
}

// Logger class
class Logger {
  private readonly isDevelopment: boolean;
  private readonly minLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatLogEntry(level: LogLevel, message: string, data?: Record<string, unknown>, request?: NextRequest): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...extractRequestMetadata(request),
    };

    if (data) {
      entry.data = redactSensitiveData(data);
    }

    return entry;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>, request?: NextRequest): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatLogEntry(level, message, data, request);
    
    // In development, use console with colors
    if (this.isDevelopment) {
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[35m', // Magenta
      };
      const reset = '\x1b[0m';
      
      console.log(
        `${colors[level]}[${level.toUpperCase()}]${reset} ${entry.timestamp}`,
        `\nMessage: ${entry.message}`,
        entry.data ? `\nData: ${JSON.stringify(entry.data, null, 2)}` : '',
        entry.requestId ? `\nRequest ID: ${entry.requestId}` : '',
        entry.ip ? `\nIP: ${entry.ip}` : '',
        entry.path ? `\nPath: ${entry.method} ${entry.path}` : '',
        '\n'
      );
    } else {
      // In production, output JSON for log aggregation
      console.log(JSON.stringify(entry));
    }
  }

  // Public logging methods
  error(message: string, data?: Record<string, unknown>, request?: NextRequest): void {
    this.log(LogLevel.ERROR, message, data, request);
  }

  warn(message: string, data?: Record<string, unknown>, request?: NextRequest): void {
    this.log(LogLevel.WARN, message, data, request);
  }

  info(message: string, data?: Record<string, unknown>, request?: NextRequest): void {
    this.log(LogLevel.INFO, message, data, request);
  }

  debug(message: string, data?: Record<string, unknown>, request?: NextRequest): void {
    this.log(LogLevel.DEBUG, message, data, request);
  }

  // Security-specific logging
  security(message: string, data?: Record<string, unknown>, request?: NextRequest): void {
    // Always log security events, regardless of level
    const entry = this.formatLogEntry(LogLevel.INFO, `[SECURITY] ${message}`, data, request);
    console.log(JSON.stringify({ ...entry, isSecurityEvent: true }));
  }
}

// Export a singleton instance
export const logger = new Logger(); 