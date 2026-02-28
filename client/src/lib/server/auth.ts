import { SignJWT, jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';

const secret = new TextEncoder().encode(env.JWT_SECRET || 'fallback_secret_for_dev_only');

export async function createJWT(userId: string, role: string) {
    const alg = 'HS256';
    return new SignJWT({ role })
        .setProtectedHeader({ alg })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
}

export async function verifyJWT(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (e) {
        return null;
    }
}

export async function requireAuth(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token);
    
    if (!payload || !payload.sub) return null;
    
    return {
        id: payload.sub,
        role: payload.role as string
    };
}
