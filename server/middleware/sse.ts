// server/middleware/sse.ts
import type { H3Event } from 'h3';

export default defineEventHandler((event: H3Event) => {
  // Check if request is for SSE endpoint
  if (event.path?.startsWith('/api/sse/')) {
    // Set headers for better SSE stability
    setHeader(event, 'Content-Type', 'text/event-stream');
    setHeader(event, 'Cache-Control', 'no-cache, no-transform');
    setHeader(event, 'Connection', 'keep-alive');
    setHeader(event, 'X-Accel-Buffering', 'no');

    // Add CORS headers if needed
    setHeader(event, 'Access-Control-Allow-Origin', '*');
    setHeader(event, 'Access-Control-Allow-Credentials', 'true');

    // Enable chunked transfer encoding
    setHeader(event, 'Transfer-Encoding', 'chunked');

    // Add keepalive handling
    const keepaliveInterval = setInterval(() => {
      try {
        event.node.res.write(':\n\n');
      } catch (err) {
        clearInterval(keepaliveInterval);
      }
    }, 30000);

    // Cleanup on connection close
    event.node.req.on('close', () => {
      clearInterval(keepaliveInterval);
    });
  }
});
