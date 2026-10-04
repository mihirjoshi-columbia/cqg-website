// Resume uploads go through a Server Action, so the request body has to fit
// under BOTH Next's Server Action body limit (next.config.ts, 1 MB by
// default) and Vercel's 4.5 MB serverless request cap. 4 MB of file leaves
// room for multipart overhead under next.config.ts's 4.5mb.
export const RESUME_MAX_BYTES = 4 * 1024 * 1024;
export const RESUME_MAX_LABEL = "4MB";

// Phones often report an empty or generic MIME type for PDFs (iCloud, Google
// Drive, share sheets), so trust the file's own header instead of file.type.
// The PDF spec allows junk before "%PDF-" within the first 1024 bytes.
export async function looksLikePdf(file: File): Promise<boolean> {
    const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
    const text = new TextDecoder("latin1").decode(head);
    return text.includes("%PDF-");
}
