// utils/hash.ts
export async function calculateHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    let result = '';
    const view = new DataView(hashBuffer);
    for (let i = 0; i < hashBuffer.byteLength; i += 4) {
        result += ('00000000' + view.getUint32(i).toString(16)).slice(-8);
    }
    return result;
}