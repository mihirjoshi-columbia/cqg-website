// Runs one compiled C++ solution (from cpp-compile-worker.js) against test
// inputs. Disposable: the page terminates it on a time limit and starts a
// fresh one, which is cheap because it only holds the ~1 MB program.
//
// The program is wasm32-wasi, so it needs a WASI implementation. This is the
// smallest one that serves a judge: stdin from memory, stdout/stderr into
// memory, a clock, randomness, exit. There is no filesystem, and any other
// call answers ENOSYS.

const ESUCCESS = 0;
const EBADF = 8;
const ENOSYS = 52;
const ESPIPE = 70;
const OUTPUT_LIMIT = 64 * 1024 * 1024;

class Exit {
    constructor(code) {
        this.code = code;
    }
}
class OutputLimit {}

function wasiImports(input, getMemory, stdout, stderr) {
    let readAt = 0;
    let written = 0;
    const view = () => new DataView(getMemory().buffer);
    const bytes = () => new Uint8Array(getMemory().buffer);

    function iovecs(ptr, count) {
        const v = view();
        const list = [];
        for (let i = 0; i < count; i++) {
            list.push([v.getUint32(ptr + i * 8, true), v.getUint32(ptr + i * 8 + 4, true)]);
        }
        return list;
    }

    return {
        args_sizes_get(argc, size) {
            view().setUint32(argc, 0, true);
            view().setUint32(size, 0, true);
            return ESUCCESS;
        },
        args_get: () => ESUCCESS,
        environ_sizes_get(count, size) {
            view().setUint32(count, 0, true);
            view().setUint32(size, 0, true);
            return ESUCCESS;
        },
        environ_get: () => ESUCCESS,
        clock_res_get(_id, out) {
            view().setBigUint64(out, BigInt(1000), true);
            return ESUCCESS;
        },
        clock_time_get(id, _precision, out) {
            // 0 is the realtime clock; everything else is monotonic.
            const ns =
                id === 0
                    ? BigInt(Date.now()) * BigInt(1000000)
                    : BigInt(Math.round(performance.now() * 1000000));
            view().setBigUint64(out, ns, true);
            return ESUCCESS;
        },
        fd_read(fd, iovs, count, nread) {
            if (fd !== 0) return EBADF;
            let total = 0;
            for (const [ptr, len] of iovecs(iovs, count)) {
                const chunk = input.subarray(readAt, readAt + len);
                bytes().set(chunk, ptr);
                readAt += chunk.length;
                total += chunk.length;
                if (chunk.length < len) break;
            }
            view().setUint32(nread, total, true);
            return ESUCCESS;
        },
        fd_write(fd, iovs, count, nwritten) {
            if (fd !== 1 && fd !== 2) return EBADF;
            let total = 0;
            for (const [ptr, len] of iovecs(iovs, count)) {
                (fd === 1 ? stdout : stderr).push(bytes().slice(ptr, ptr + len));
                total += len;
            }
            written += total;
            if (written > OUTPUT_LIMIT) throw new OutputLimit();
            view().setUint32(nwritten, total, true);
            return ESUCCESS;
        },
        fd_fdstat_get(fd, out) {
            if (fd > 2) return EBADF;
            // A character device WITH seek rights reads as "not a terminal"
            // to wasi-libc, so stdout is fully buffered, not flushed per line.
            const v = view();
            v.setUint8(out, 2);
            v.setUint16(out + 2, 0, true);
            v.setBigUint64(out + 8, BigInt.asUintN(64, BigInt(-1)), true);
            v.setBigUint64(out + 16, BigInt.asUintN(64, BigInt(-1)), true);
            return ESUCCESS;
        },
        fd_close: () => ESUCCESS,
        fd_seek: () => ESPIPE,
        fd_prestat_get: () => EBADF,
        fd_prestat_dir_name: () => EBADF,
        random_get(ptr, len) {
            for (let at = 0; at < len; at += 65536) {
                crypto.getRandomValues(bytes().subarray(ptr + at, ptr + Math.min(len, at + 65536)));
            }
            return ESUCCESS;
        },
        sched_yield: () => ESUCCESS,
        proc_exit(code) {
            throw new Exit(code);
        },
    };
}

function join(chunks) {
    const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let at = 0;
    for (const chunk of chunks) {
        out.set(chunk, at);
        at += chunk.length;
    }
    return new TextDecoder().decode(out);
}

let program = null;

async function run(input) {
    const compiled = await program;
    const stdout = [];
    const stderr = [];
    let memory = null;
    const wasi = wasiImports(new TextEncoder().encode(input), () => memory, stdout, stderr);
    // Anything the program imports that the shim lacks answers ENOSYS
    // rather than failing to link.
    const imports = { wasi_snapshot_preview1: {} };
    for (const { module: from, name } of WebAssembly.Module.imports(compiled)) {
        if (from !== "wasi_snapshot_preview1") continue;
        imports.wasi_snapshot_preview1[name] = wasi[name] ?? (() => ENOSYS);
    }
    const instance = await WebAssembly.instantiate(compiled, imports);
    memory = instance.exports.memory;

    const started = performance.now();
    let error = null;
    try {
        instance.exports._start();
    } catch (e) {
        if (e instanceof Exit) {
            if (e.code !== 0) error = `Exited with code ${e.code}.`;
        } else if (e instanceof OutputLimit) {
            error = "Printed more than 64 MB of output.";
        } else if (/call stack|too much recursion/i.test(e?.message ?? "")) {
            error = "Stack overflow. Recursion in the browser is limited to about 10,000 levels.";
        } else {
            error = `Crashed: ${e?.message ?? e}`;
        }
    }
    const ms = performance.now() - started;
    const err = join(stderr).trim();
    if (error && err) error = `${err.slice(-2000)}\n\n${error}`;
    return { stdout: join(stdout), error, ms };
}

self.onmessage = async (event) => {
    const message = event.data;
    if (message.type === "load") {
        program = WebAssembly.compile(message.bytes);
        await program;
        self.postMessage({ type: "loaded" });
        return;
    }
    const result = await run(message.input);
    self.postMessage({ type: "result", id: message.id, ...result });
};
