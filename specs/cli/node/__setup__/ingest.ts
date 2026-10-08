import { createServer } from 'node:http';
import type { IncomingHttpHeaders } from 'node:http';

// value: the headers an OpenPanel instance reads to authenticate the client and to derive the visitor's geolocation and device.
const READ_HEADERS = [
    'openpanel-client-id',
    'openpanel-client-secret',
    'openpanel-client-ip',
    'user-agent',
] as const;

function headersOf(headers: IncomingHttpHeaders): string {
    return READ_HEADERS.filter((name) => headers[name] !== undefined)
        .map((name) => `${name}=${String(headers[name])}`)
        .join(' ');
}

/** An OpenPanel ingest on a free local port, accepting every event and keeping one line per request: its method, path, read headers and body. */
export async function startIngest(): Promise<
    AsyncDisposable & { received: () => string; url: string }
> {
    const received: string[] = [];
    const server = createServer((request, response) => {
        const chunks: Buffer[] = [];
        request.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });
        request.on('end', () => {
            received.push(
                `${String(request.method)} ${String(request.url)} [${headersOf(request.headers)}] ${Buffer.concat(chunks).toString('utf8')}`,
            );
            response.writeHead(200, { 'content-type': 'application/json' }).end('{}');
        });
    });
    await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;

    return {
        [Symbol.asyncDispose]: async () => {
            await new Promise((resolve) => {
                server.close(resolve);
            });
        },
        received: () => received.map((line) => `${line}\n`).join(''),
        url: `http://127.0.0.1:${port}/api`,
    };
}
