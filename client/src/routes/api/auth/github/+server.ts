import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';

export async function GET() {
    const clientId = env.GITHUB_CLIENT_ID || 'dummy';
    const redirectUri = env.REDIRECT_URL || 'http://localhost:5173/api/auth/github/callback';
    const state = crypto.randomUUID();
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=${state}`;
    
    redirect(302, authUrl);
}
