import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

function googleDriveAudioProxyPlugin(): Plugin {
  return {
    name: 'google-drive-audio-proxy',
    configureServer(server) {
      server.middlewares.use('/api/audio-proxy', async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const urlObj = new URL(req.url || '', 'http://localhost');
          const id = urlObj.searchParams.get('id');
          const rawUrl = urlObj.searchParams.get('url');

          if (!id && !rawUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Missing Google Drive file id or audio url');
            return;
          }

          const targetUrl = id
            ? `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`
            : (rawUrl || '');

          const fetchHeaders: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': '*/*',
          };

          if (req.headers.range) {
            fetchHeaders['Range'] = req.headers.range as string;
          }

          let response = await fetch(targetUrl, {
            headers: fetchHeaders,
            redirect: 'follow',
          });

          // Check if Google Drive returned an HTML warning (e.g. virus scan interstitial)
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html') && id) {
            const htmlText = await response.text();
            const confirmMatch = htmlText.match(/name="confirm"\s+value="([^"]+)"/) ||
                                 htmlText.match(/confirm=([0-9a-zA-Z_-]+)/) ||
                                 htmlText.match(/\/uc\?export=download&amp;confirm=([^&"]+)/);
            const confirmToken = confirmMatch ? confirmMatch[1] : 't';
            const retryUrl = `https://drive.google.com/uc?export=download&id=${id}&confirm=${confirmToken}`;

            response = await fetch(retryUrl, {
              headers: fetchHeaders,
              redirect: 'follow',
            });
          }

          res.statusCode = response.status;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Range');
          res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
          res.setHeader('Accept-Ranges', 'bytes');

          const forwardHeaders = ['content-type', 'content-length', 'content-range', 'cache-control'];
          for (const header of forwardHeaders) {
            const val = response.headers.get(header);
            if (val) {
              res.setHeader(header, val);
            }
          }

          // Force audio/mpeg if content-type is octet-stream or text/html
          const finalCt = res.getHeader('content-type') as string | undefined;
          if (!finalCt || finalCt.includes('text/html') || finalCt.includes('application/octet-stream')) {
            res.setHeader('content-type', 'audio/mpeg');
          }

          if (!response.body) {
            res.end();
            return;
          }

          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            res.write(Buffer.from(value));
          }
        } catch (error) {
          console.error('[AudioProxy] Stream proxy error:', error);
          if (!res.headersSent) {
            res.statusCode = 502;
            res.end('Proxy error fetching Google Drive audio stream');
          }
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), googleDriveAudioProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
