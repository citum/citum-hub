import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';

export async function GET({ url }) {
    const clientId = env.GITHUB_CLIENT_ID || 'dummy';
    // Use the request origin to build the redirect URI if not explicitly set
    const redirectUri = env.REDIRECT_URL || `${url.origin}/api/auth/github/callback`;
    const state = crypto.randomUUID();
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`;
    
    redirect(302, authUrl);
}
