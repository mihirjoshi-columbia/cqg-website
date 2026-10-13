// Installs the extensionless-import hook. Used as:
//   node --experimental-strip-types --import ./scripts/register-ts.mjs <script>
import { register } from "node:module";
register("./ts-extensionless-resolve.mjs", import.meta.url);
