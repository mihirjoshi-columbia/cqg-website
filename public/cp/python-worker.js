// Runs member Python for the competitive programming judge (lib/cp/runner.ts).
//
// A plain script in public/ rather than a bundled module because Pyodide is
// loaded with importScripts from its CDN. One worker serves a whole
// submission; the page terminates it on a time limit and starts a new one.
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

const HARNESS = `
import io, sys, traceback

def _cqg_run(src, data):
    stdin = io.TextIOWrapper(io.BytesIO(data.encode()), encoding="utf-8")
    raw = io.BytesIO()
    stdout = io.TextIOWrapper(raw, encoding="utf-8", write_through=True)
    sys.stdin, sys.stdout = stdin, stdout
    error = None
    try:
        exec(compile(src, "solution.py", "exec"), {"__name__": "__main__"})
    except SystemExit as e:
        if e.code not in (None, 0):
            error = f"SystemExit: {e.code}"
    except BaseException as e:
        # Drop the harness frame so the traceback starts in solution.py.
        error = "".join(traceback.format_exception(type(e), e, e.__traceback__.tb_next))
    finally:
        sys.stdin, sys.stdout = sys.__stdin__, sys.__stdout__
        try:
            stdout.flush()
        except Exception:
            pass
    return raw.getvalue().decode("utf-8", "replace"), error
`;

const ready = (async () => {
    const pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" });
    pyodide.runPython(HARNESS);
    return pyodide;
})();

ready.then(
    () => self.postMessage({ type: "ready" }),
    (error) => self.postMessage({ type: "load-error", message: String(error) }),
);

self.onmessage = async (event) => {
    const { id, src, input } = event.data;
    const pyodide = await ready;
    const run = pyodide.globals.get("_cqg_run");
    const started = performance.now();
    const result = run(src, input);
    const ms = performance.now() - started;
    const [stdout, error] = result.toJs();
    result.destroy();
    run.destroy();
    self.postMessage({ type: "result", id, stdout, error: error ?? null, ms });
};
