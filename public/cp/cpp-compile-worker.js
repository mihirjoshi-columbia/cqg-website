// Compiles member C++ for the competitive programming judge (lib/cp/runner.ts).
//
// Clang itself, built for WebAssembly by YoWASP, loaded from jsDelivr: about
// 24 MB compressed on first use, then the browser cache. It emits a
// wasm32-wasi program that public/cp/cpp-run-worker.js runs. Compiling and
// running are separate workers so a time limit can kill the program without
// throwing away a compiler that took seconds to start.
//
// Toolchain limits worth knowing, all surfaced on the page:
//   - no C++ exceptions (wasi libc++ is built without them), hence
//     -fno-exceptions; a `throw` is a compile error, a failed .at() aborts;
//   - recursion is capped by the browser's own stack, about 10^4 frames;
//   - <bits/stdc++.h> is GCC's, not libc++'s, so we supply our own below.
import { runClang } from "https://cdn.jsdelivr.net/npm/@yowasp/clang@22.0.0-git20695-13/gen/bundle.js";

const FLAGS = [
    "-O2",
    "-std=gnu++20",
    "-fno-exceptions",
    "-I.",
    // A shadow stack for address-taken locals; --stack-first makes
    // overflowing it trap instead of silently overwriting globals.
    "-Wl,-z,stack-size=33554432",
    "-Wl,--stack-first",
    "-lc-printscan-long-double",
];

const STDCPP = [
    "algorithm", "array", "bit", "bitset", "cassert", "cctype", "cfloat", "chrono", "cinttypes",
    "climits", "cmath", "complex", "cstdint", "cstdio", "cstdlib", "cstring", "ctime", "deque",
    "functional", "iomanip", "iostream", "iterator", "limits", "list", "map", "memory", "numbers",
    "numeric", "optional", "queue", "random", "ranges", "set", "span", "sstream", "stack", "string",
    "tuple", "unordered_map", "unordered_set", "utility", "vector",
]
    .map((name) => `#include <${name}>`)
    .join("\n");

self.onmessage = async (event) => {
    const { id, src } = event.data;
    const decoder = new TextDecoder();
    let stderr = "";
    try {
        const files = await runClang(
            ["clang++", ...FLAGS, "solution.cpp", "-o", "solution.wasm"],
            { "solution.cpp": src, bits: { "stdc++.h": STDCPP } },
            {
                stdout: null,
                stderr: (bytes) => {
                    if (bytes) stderr += decoder.decode(bytes, { stream: true });
                },
                fetchProgress: ({ totalLength, doneLength }) =>
                    self.postMessage({ type: "progress", done: doneLength, total: totalLength }),
            },
        );
        // Copied so the transfer cannot detach a buffer clang still owns.
        const bytes = files["solution.wasm"].slice();
        self.postMessage({ type: "compiled", id, bytes }, [bytes.buffer]);
    } catch (error) {
        self.postMessage({
            type: "compile-error",
            id,
            message: stderr.trim() || String(error?.message ?? error),
        });
    }
};
