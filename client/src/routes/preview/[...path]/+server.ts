import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export async function POST({ request, params, fetch }) {
    const citumUrl = env.CITUM_URL || 'http://127.0.0.1:3001';
    
    try {
        const body = await request.json();
        const { style, references } = body;
        
        // 1. Write the style to the shared temp directory
        // The path inside the container will be /tmp/citum/styles/preview.yaml
        const tempDir = path.join(process.cwd(), 'temp_styles');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const styleYaml = yaml.dump(style);
        const fileName = `preview-${crypto.randomUUID()}.yaml`;
        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, styleYaml);
        
        // 2. Prepare the JSON-RPC request for citum-server
        // We tell citum-server the path *inside its own container*
        const containerStylePath = `/tmp/citum/styles/${fileName}`;
        
        const rpcMethod = params.path === 'citation' ? 'render_citation' : 'render_bibliography';
        
        // citum-server expects a map for references
        const refsMap = references.reduce((acc: any, r: any) => {
            acc[r.id] = r;
            return acc;
        }, {});

        const rpcParams: any = {
            style_path: containerStylePath,
            refs: refsMap
        };
        
        if (params.path === 'citation') {
            // For render_citation, we need a citation object. 
            // We'll cite all references provided for the preview.
            rpcParams.citation = {
                items: references.map((r: any) => ({ id: r.id }))
            };
        }
        
        const rpcRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: rpcMethod,
            params: rpcParams
        };

        const response = await fetch(`${citumUrl}/rpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rpcRequest)
        });
        
        if (!response.ok) {
            const errText = await response.text();
            console.error('Citum server error:', errText);
            throw error(500, 'Citum server returned an error');
        }

        const rpcResponse = await response.json();
        
        // Cleanup the temp file
        try { fs.unlinkSync(filePath); } catch(e) {}

        if (rpcResponse.error) {
            console.error('RPC Error:', rpcResponse.error);
            return new Response(JSON.stringify({ result: `Error: ${rpcResponse.error.message}` }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // render_bibliography returns a Vec<String>, we might want to join it
        let result = rpcResponse.result.result;
        if (Array.isArray(result)) {
            result = result.join('\n');
        }

        return new Response(JSON.stringify({ result }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error('Preview proxy error:', e);
        throw error(500, 'Error communicating with citum-server');
    }
}
