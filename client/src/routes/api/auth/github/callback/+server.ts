import { env } from '$env/dynamic/private';
import { redirect, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { createJWT } from '$lib/server/auth';

export async function GET({ url, fetch }) {
    const code = url.searchParams.get('code');
    if (!code) {
        throw redirect(302, '/');
    }

    const clientId = env.GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        console.error('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
        throw error(500, 'OAuth configuration missing');
    }

    const redirectUri = env.REDIRECT_URL || `${url.origin}/api/auth/github/callback`;

    try {
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
            console.error('GitHub token exchange failed:', tokenData);
            throw redirect(302, '/?error=auth_failed');
        }

        // 2. Get user from GitHub
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'citum-hub'
            }
        });
        
        if (!userResponse.ok) {
            console.error('GitHub user fetch failed:', await userResponse.text());
            throw error(500, 'Failed to fetch user from GitHub');
        }
        
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
        } catch (dbErr: any) {
            console.error('Database error during user upsert:', dbErr);
            throw error(500, `Database error: ${dbErr.message}`);
        } finally {
            client.release();
        }

        // 4. Create JWT and Redirect
        const jwt = await createJWT(user.id, user.role);
        
        // Redirect back to frontend with token
        throw redirect(302, `/auth/callback?token=${jwt}`);
    } catch (err: any) {
        if (err.status && err.location) throw err; // Re-throw redirects
        console.error('Login callback error:', err);
        throw error(500, err.message || 'Authentication error');
    }
}
