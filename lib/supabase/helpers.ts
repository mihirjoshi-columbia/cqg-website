import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Working around a real upstream inference bug: with this schema (many
// tables, some interface-typed Row/Insert shapes), @supabase/postgrest-js
// 2.114.0's `.insert()`/`.update()` generic constraint resolves to `never`
// for reasons unrelated to the actual data being inserted (confirmed via
// isolated repro — narrows to specific column-name/table-name combinations
// in this schema, not anything wrong with our Insert/Update types
// themselves). `.select()` chains hit the same bug and are fixed inline with
// `.overrideTypes<T, { merge: false }>()`; inserts/updates have no such
// escape hatch, so these wrappers cast the untyped builder internally while
// keeping the external signature fully typed against `Database`, so callers
// still get compile-time checking on the values they pass.
type Tables = Database["public"]["Tables"];

export async function insertRow<T extends keyof Tables>(
    client: SupabaseClient<Database>,
    table: T,
    values: Tables[T]["Insert"]
): Promise<{ error: PostgrestError | null }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client.from(table) as any).insert(values);
    return { error };
}

export async function insertRows<T extends keyof Tables>(
    client: SupabaseClient<Database>,
    table: T,
    values: Tables[T]["Insert"][]
): Promise<{ error: PostgrestError | null }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client.from(table) as any).insert(values);
    return { error };
}

export async function updateRow<T extends keyof Tables>(
    client: SupabaseClient<Database>,
    table: T,
    id: string,
    values: Tables[T]["Update"]
): Promise<{ error: PostgrestError | null }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client.from(table) as any).update(values).eq("id", id);
    return { error };
}

// Same bug, same workaround, for .rpc() — calling a SECURITY DEFINER function
// (cqg_event_apply/withdraw/decide/set_attendance) hits the identical
// never/undefined collapse on the args parameter's inferred type.
type Functions = Database["public"]["Functions"];

export async function callRpc<T extends keyof Functions>(
    client: SupabaseClient<Database>,
    fn: T,
    args: Functions[T]["Args"]
): Promise<{ data: Functions[T]["Returns"] | null; error: PostgrestError | null }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client.rpc as any)(fn, args);
}
