#!/usr/bin/env deno run --allow-read --allow-write

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";

interface FunctionReference {
  functionName: string;
  file: string;
  line: number;
}

interface EdgeFunctionStatus {
  name: string;
  hasEntrypoint: boolean;
  isReferenced: boolean;
  references: FunctionReference[];
}

async function findFunctionReferences(): Promise<FunctionReference[]> {
  const references: FunctionReference[] = [];
  const pattern = /supabase\.functions\.invoke\s*\(\s*['"`]([^'"`]+)['"`]/g;

  for await (const entry of walk("src", { exts: [".ts", ".tsx", ".js", ".jsx"] })) {
    try {
      const content = await Deno.readTextFile(entry.path);
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          references.push({
            functionName: match[1],
            file: entry.path,
            line: index + 1
          });
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not read ${entry.path}: ${error.message}`);
    }
  }

  return references;
}

async function findExistingFunctions(): Promise<string[]> {
  const functions: string[] = [];
  
  try {
    for await (const entry of Deno.readDir("supabase/functions")) {
      if (entry.isDirectory) {
        try {
          const indexPath = `supabase/functions/${entry.name}/index.ts`;
          await Deno.stat(indexPath);
          functions.push(entry.name);
        } catch {
          // index.ts doesn't exist for this function
        }
      }
    }
  } catch (error) {
    console.warn("Warning: Could not read supabase/functions directory:", error.message);
  }

  return functions;
}

async function createStubFunction(functionName: string): Promise<void> {
  const functionDir = `supabase/functions/${functionName}`;
  const indexPath = `${functionDir}/index.ts`;
  
  try {
    await Deno.mkdir(functionDir, { recursive: true });
    
    const stubCode = `// Auto-generated stub for ${functionName}
// This function was referenced in the code but missing an implementation

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log('${functionName} called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = req.method !== 'GET' ? await req.json() : {};
    
    console.log('${functionName} request body:', JSON.stringify(body, null, 2));

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Function not implemented yet',
        message: 'This is a stub function. Please implement the actual logic.',
        functionName: '${functionName}'
      }),
      {
        status: 501,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in ${functionName}:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
`;

    await Deno.writeTextFile(indexPath, stubCode);
    console.log(`✅ Created stub function: ${functionName}`);
  } catch (error) {
    console.error(`❌ Failed to create stub for ${functionName}:`, error.message);
  }
}

async function main() {
  console.log('🔍 Analyzing edge functions...\n');

  const [references, existingFunctions] = await Promise.all([
    findFunctionReferences(),
    findExistingFunctions()
  ]);

  // Group references by function name
  const referenceMap = new Map<string, FunctionReference[]>();
  references.forEach(ref => {
    if (!referenceMap.has(ref.functionName)) {
      referenceMap.set(ref.functionName, []);
    }
    referenceMap.get(ref.functionName)!.push(ref);
  });

  // Get all unique function names
  const allFunctionNames = new Set([
    ...Array.from(referenceMap.keys()),
    ...existingFunctions
  ]);

  const functionStatus: EdgeFunctionStatus[] = Array.from(allFunctionNames).map(name => ({
    name,
    hasEntrypoint: existingFunctions.includes(name),
    isReferenced: referenceMap.has(name),
    references: referenceMap.get(name) || []
  }));

  // Sort by status and name
  functionStatus.sort((a, b) => {
    if (a.hasEntrypoint !== b.hasEntrypoint) {
      return a.hasEntrypoint ? 1 : -1; // Missing entrypoints first
    }
    return a.name.localeCompare(b.name);
  });

  let hasIssues = false;
  const autoStub = Deno.args.includes('--auto-stub');

  console.log('📊 Edge Functions Status:\n');

  functionStatus.forEach(func => {
    const status = func.hasEntrypoint ? '✅' : '❌';
    const usage = func.isReferenced ? `(${func.references.length} refs)` : '(unused)';
    
    console.log(`${status} ${func.name} ${usage}`);
    
    if (!func.hasEntrypoint && func.isReferenced) {
      hasIssues = true;
      console.log(`   Missing index.ts - referenced in:`);
      func.references.forEach(ref => {
        console.log(`   - ${ref.file}:${ref.line}`);
      });
      
      if (autoStub) {
        createStubFunction(func.name);
      }
    }
  });

  if (hasIssues) {
    console.log('\n❌ Issues found! Some functions are referenced but missing index.ts files.');
    if (!autoStub) {
      console.log('Run with --auto-stub to create stub implementations automatically.');
    }
    Deno.exit(1);
  } else {
    console.log('\n✅ All edge functions are properly configured!');
  }

  console.log(`\n📈 Summary: ${existingFunctions.length} functions with entrypoints, ${references.length} total references`);
}

if (import.meta.main) {
  main();
}