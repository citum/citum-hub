import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export async function POST({ request, params, fetch }) {
    const citumUrl = env.CITUM_URL || 'http://127.0.0.1:9000';
    console.log(`[Proxy] Incoming preview request for ${params.path}`);
    
    try {
        const body = await request.json();
        const { style, references } = body;
        
        if (!style || !references) {
            console.error('[Proxy] Missing style or references in payload');
            throw error(400, 'Missing style or references');
        }

        // 1. Write the style to the shared temp directory
        const tempDir = path.join(process.cwd(), 'temp_styles');
        if (!fs.existsSync(tempDir)) {
            console.log(`[Proxy] Creating temp directory: ${tempDir}`);
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const styleYaml = yaml.dump(style);
        const fileName = `preview-${crypto.randomUUID()}.yaml`;
        const filePath = path.join(tempDir, fileName);
        
        console.log(`[Proxy] Writing temp style to: ${filePath}`);
        fs.writeFileSync(filePath, styleYaml);
        
        // 2. Prepare the JSON-RPC request for citum-server
        // The path inside the citum container is /tmp/citum/styles/
        const containerStylePath = `/tmp/citum/styles/${fileName}`;
        
        const rpcMethod = params.path === 'citation' ? 'render_citation' : 'render_bibliography';
        
        const refsMap = references.reduce((acc: any, r: any) => {
            acc[r.id] = r;
            return acc;
        }, {});

        const rpcParams: any = {
            style_path: containerStylePath,
            refs: refsMap
        };
        
        if (params.path === 'citation') {
            rpcParams.citation = {
                items: references.map((r: any) => ({ id: r.id }))
            };
        }
        
        const rpcRequest = {
            jsonrpc: "2.0",
            id: Date.now(),
            method: rpcMethod,
            params: rpcParams
        };

        console.log(`[Proxy] Sending RPC request to ${citumUrl}/rpc:`, JSON.stringify(rpcRequest, null, 2));

        const response = await fetch(`${citumUrl}/rpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rpcRequest)
        });
        
        if (!response.ok) {
            const errText = await response.text();
            console.error('[Proxy] Citum server HTTP error:', response.status, errText);
            throw error(500, `Citum server error: ${response.status}`);
        }

        const rpcResponse = await response.json();
        console.log(`[Proxy] Received RPC response:`, JSON.stringify(rpcResponse, null, 2));
        
        // Cleanup the temp file
        try { 
            fs.unlinkSync(filePath); 
            console.log(`[Proxy] Cleaned up temp file: ${filePath}`);
        } catch(e) {
            console.warn(`[Proxy] Failed to cleanup temp file: ${filePath}`, e);
        }

        if (rpcResponse.error) {
            console.error('[Proxy] RPC Error returned from server:', rpcResponse.error);
            return new Response(JSON.stringify({ result: `Error: ${rpcResponse.error.message || 'Unknown RPC error'}` }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Handle the nested result structure from Citum Hub's RPC implementation
        let result = rpcResponse.result?.result;
        if (result === undefined) {
            console.warn('[Proxy] RPC response missing result.result, checking result directly');
            result = rpcResponse.result;
        }

        if (Array.isArray(result)) {
            result = result.join('\n');
        }

        return new Response(JSON.stringify({ result: result || 'No output from engine' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[Proxy] Global preview proxy error:', e);
        throw error(500, `Preview failed: ${e.message}`);
    }
}
