import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { processDocsChanges } from '../../../../utils/githubProcessor';

interface GitHubWebhookPayload {
  ref: string;
  commits: Array<{
    id: string;
    message: string;
    timestamp: string;
    url: string;
    author: {
      name: string;
      email: string;
    };
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  repository: {
    name: string;
    full_name: string;
    html_url: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature for security
    const signature = request.headers.get('x-hub-signature-256');
    const body = await request.text();
    
    console.log('Webhook received:');
    console.log('Signature:', signature);
    console.log('Body length:', body.length);
    console.log('Body preview:', body.substring(0, 200) + '...');
    
    if (!signature) {
      console.error('No signature provided');
      return NextResponse.json({ error: 'No signature provided' }, { status: 401 });
    }

    // Verify webhook signature
    const providedSignature = signature.replace('sha256=', '');
    const expectedSignature = createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex');
    
    console.log('Provided signature:', providedSignature);
    console.log('Expected signature:', expectedSignature);
    console.log('Webhook secret length:', (process.env.GITHUB_WEBHOOK_SECRET || '').length);
    
    if (expectedSignature !== providedSignature) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: GitHubWebhookPayload = JSON.parse(body);
    
    // Only process pushes to master branch
    if (payload.ref !== 'refs/heads/master') {
      console.log('Ignoring push to non-master branch:', payload.ref);
      return NextResponse.json({ message: 'Ignored non-master branch' });
    }

    // Only process sentry-docs repository
    if (payload.repository.full_name !== 'getsentry/sentry-docs') {
      console.log('Ignoring non-sentry-docs repository:', payload.repository.full_name);
      return NextResponse.json({ message: 'Ignored non-sentry-docs repository' });
    }

    console.log(`Processing ${payload.commits.length} commits from sentry-docs`);

    // Process each commit
    for (const commit of payload.commits) {
      await processDocsChanges(commit);
    }

    return NextResponse.json({ 
      message: 'Webhook processed successfully',
      commitsProcessed: payload.commits.length 
    });

  } catch (error) {
    console.error('Error processing GitHub webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ 
    message: 'GitHub webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
