import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { createJWT } from '$lib/server/auth';

export async function GET({ url }) {
    const code = url.searchParams.get('code');
    if (!code) {
        throw redirect(302, '/');
    }

    const clientId = env.GITHUB_CLIENT_ID || 'dummy';
    const clientSecret = env.GITHUB_CLIENT_SECRET || 'dummy';
    const redirectUri = env.REDIRECT_URL || 'http://localhost:5173/api/auth/github/callback';

    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri
        })
    });
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
        throw redirect(302, '/?error=auth_failed');
    }

    // 2. Get user from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'citum-hub'
        }
    });
    
    const githubUser = await userResponse.json();
    const email = githubUser.email || `${githubUser.login}@github.com`;

    // 3. Upsert User in DB
    const client = await pool.connect();
    let user;
    try {
        const result = await client.query(`
            INSERT INTO users (email, github_id)
            VALUES ($1, $2)
            ON CONFLICT (github_id) DO UPDATE SET email = EXCLUDED.email
            RETURNING id, email, role
        `, [email, githubUser.id.toString()]);
        user = result.rows[0];
    } finally {
        client.release();
    }

    // 4. Create JWT and Redirect
    const jwt = await createJWT(user.id, user.role);
    
    // Redirect back to frontend with token
    throw redirect(302, `/auth/callback?token=${jwt}`);
}
