// Development utilities for server components

// Check if a function is being used in a server component
export function checkServerComponentUsage(functionName: string): void {
  if (process.env.NODE_ENV === 'development') {
    const stack = new Error().stack;
    if (stack?.includes('use client')) {
      console.warn(
        `Warning: ${functionName} is being used in a client component. ` +
        'This function is only meant to be used in server components.'
      );
    }
  }
}

// Development warnings for common issues
export function devWarning(type: 'cookie' | 'headers' | 'server', message: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[${type.toUpperCase()}] ${message}`);
  }
} 