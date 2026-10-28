import { once } from "node:events";
import { connect } from "node:net";
import { Readable } from "node:stream";

export interface ClamScanResult {
  clean: boolean;
  signature?: string;
}

/**
 * Minimal ClamAV client using the `clamd` INSTREAM protocol.
 *
 * No dependency and no API key — it talks to a local/sidecar `clamd` over TCP:
 *   zINSTREAM\0  →  <uint32 length><chunk>…  →  0x00000000  →  "stream: OK\0"
 *
 * `scanStream` sends the file in 64KB chunks with backpressure, so scanning a
 * 50MB video never buffers it in memory.
 */
export class ClamAvClient {
  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly timeoutMs = 60_000,
  ) {}

  scan(buffer: Buffer): Promise<ClamScanResult> {
    return this.run(Readable.from([buffer]));
  }

  scanStream(source: Readable): Promise<ClamScanResult> {
    return this.run(source);
  }

  private run(
    source: AsyncIterable<Buffer | string> | Readable,
  ): Promise<ClamScanResult> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let response = "";

      const socket = connect({ host: this.host, port: this.port });

      const timer = setTimeout(() => {
        fail(new Error(`ClamAV scan timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
      timer.unref?.();

      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        (source as Readable).destroy?.();
        socket.destroy();
        reject(error);
      };

      const succeed = (result: ClamScanResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        resolve(result);
      };

      socket.on("data", (data) => {
        response += data.toString("utf8");

        const terminated = response.includes("\0");
        const line = response.replace(/\0/g, "").trim();

        if (/FOUND$/i.test(line)) {
          succeed({
            clean: false,
            signature: line
              .replace(/^stream:\s*/i, "")
              .replace(/\s+FOUND$/i, "")
              .trim(),
          });
          return;
        }
        if (/(^|:\s*)OK$/i.test(line)) {
          succeed({ clean: true });
          return;
        }
        if (terminated && line) {
          fail(new Error(`ClamAV returned: ${line}`));
        }
      });

      socket.on("error", (error) => {
        fail(new Error(`ClamAV is unreachable: ${error.message}`));
      });

      socket.on("close", () => {
        if (!settled) fail(new Error("ClamAV closed the connection before replying."));
      });

      socket.on("connect", async () => {
        try {
          socket.write("zINSTREAM\0");

          for await (const raw of source as AsyncIterable<Buffer | string>) {
            if (settled) return;
            const chunk = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
            if (chunk.length === 0) continue;

            const length = Buffer.alloc(4);
            length.writeUInt32BE(chunk.length, 0);

            if (!socket.write(length)) await once(socket, "drain");
            if (!socket.write(chunk)) await once(socket, "drain");
          }

          if (settled) return;
          socket.write(Buffer.from([0, 0, 0, 0]));
        } catch (error) {
          fail(error instanceof Error ? error : new Error(String(error)));
        }
      });
    });
  }
}
