import { NextResponse } from 'next/server';
import { initLogger } from './lib/discordLogger';

// Initialize logger once when middleware loads
if (typeof global.loggerInitialized === 'undefined') {
  initLogger();
  global.loggerInitialized = true;
}

export function middleware(request) {
  // Your middleware logic here (if any)
  return NextResponse.next();
}

// This config ensures the middleware runs for all routes
export const config = {
  matcher: ['/:path*'],
};