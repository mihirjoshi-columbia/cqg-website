// Node's ESM resolver requires a file extension; the app's tsconfig uses
// "moduleResolution": "bundler", so lib/ imports are written extensionless
// (`from "./deck"`). This hook bridges the two so the ops scripts can import
// application code directly instead of keeping a duplicate copy of it.
export async function resolve(specifier, context, next) {
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
        for (const ext of [".ts", ".tsx", ".js"]) {
            try {
                return await next(specifier + ext, context);
            } catch {
                // try the next extension
            }
        }
    }
    return next(specifier, context);
}
