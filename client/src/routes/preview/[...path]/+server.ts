import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export async function POST({ request, params, fetch }) {
    const citumUrl = env.CITUM_URL || 'http://127.0.0.1:9001';
    
    try {
        const body = await request.json();
        const { style, references } = body;
        
        if (!style || !references) {
            throw error(400, 'Missing style or references');
        }

        // 1. Write the style to the shared temp directory
        const tempDir = path.join(process.cwd(), 'temp_styles');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const styleYaml = yaml.dump(style);
        const fileName = `preview-${crypto.randomUUID()}.yaml`;
        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, styleYaml);
        
        // 2. Prepare the JSON-RPC request
        const containerStylePath = `/tmp/citum/styles/${fileName}`;
        const rpcMethod = params.path === 'citation' ? 'render_citation' : 'render_bibliography';
        
        const refsMap = references.reduce((acc: any, r: any) => {
            acc[r.id] = r;
            return acc;
        }, {});

        const rpcParams: any = {
            style_path: containerStylePath,
            refs: refsMap,
            output_format: 'html' // Engine expects 'output_format'
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

        const response = await fetch(`${citumUrl}/rpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rpcRequest)
        });
        
        const rpcResponse = await response.json();
        
        // Cleanup the temp file
        try { fs.unlinkSync(filePath); } catch(e) {}

        if (rpcResponse.error) {
            console.error('[Proxy] RPC Error:', rpcResponse.error);
            return new Response(JSON.stringify({ 
                result: `<div class="text-red-500 text-xs font-mono p-2 bg-red-50 rounded">Engine Error: ${rpcResponse.error.message || rpcResponse.error}</div>` 
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Handle the engine's result structure
        let resultData = rpcResponse.result?.result;
        let finalResult = '';

        if (params.path === 'citation') {
            // render_citation returns a simple string result
            finalResult = resultData || '';
        } else {
            // render_bibliography returns a struct: { format, content, entries? }
            finalResult = resultData?.content || '';
        }

        return new Response(JSON.stringify({ result: finalResult || 'No output from engine' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error('[Proxy] Global Error:', e);
        throw error(500, `Preview failed: ${e.message}`);
    }
}
