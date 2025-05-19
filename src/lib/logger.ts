import { NextRequest } from 'next/server';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context: LogContext = {}, request?: NextRequest): string {
    const timestamp = new Date().toISOString();
    const requestInfo = request ? {
      method: request.method,
      url: request.url,
      ip: request.ip,
      path: request.nextUrl.pathname
    } : {};
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...requestInfo,
      ...context
    });
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, request?: NextRequest) {
    const formattedMessage = this.formatMessage(level, message, context, request);
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
      case 'security':
        console.error(`[SECURITY] ${formattedMessage}`);
        break;
    }
  }

  debug(message: string, context: LogContext = {}, request?: NextRequest) {
    this.log('debug', message, context, request);
  }

  info(message: string, context: LogContext = {}, request?: NextRequest) {
    this.log('info', message, context, request);
  }

  warn(message: string, context: LogContext = {}, request?: NextRequest) {
    this.log('warn', message, context, request);
  }

  error(message: string, context: LogContext = {}, request?: NextRequest) {
    this.log('error', message, context, request);
  }

  security(message: string, context: LogContext = {}, request?: NextRequest) {
    this.log('security', message, context, request);
  }
}

export const logger = new Logger(); 