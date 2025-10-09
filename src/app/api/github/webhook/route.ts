import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

interface GitHubWebhookPayload {
  ref: string;
  commits: Array<{
    id?: string;
    sha?: string;
    commit?: {
      message?: string;
      author?: {
        date?: string;
        name?: string;
        email?: string;
      };
    };
    message?: string;
    timestamp?: string;
    url?: string;
    html_url?: string;
    author?: {
      name?: string;
      email?: string;
    };
    added?: string[];
    removed?: string[];
    modified?: string[];
    files?: Array<{
      filename: string;
      status: string;
    }>;
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
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || '';
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    
    console.log('Provided signature:', providedSignature);
    console.log('Expected signature:', expectedSignature);
    console.log('Webhook secret (first 4 chars):', webhookSecret.substring(0, 4) + '...');
    console.log('Webhook secret length:', webhookSecret.length);
    
    if (expectedSignature !== providedSignature) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: GitHubWebhookPayload = JSON.parse(body);
    
    // Only process pushes to main/master branch
    if (payload.ref !== 'refs/heads/main' && payload.ref !== 'refs/heads/master') {
      console.log('Ignoring push to non-main/master branch:', payload.ref);
      return NextResponse.json({ message: 'Ignored non-main/master branch' });
    }

    // Only process sentry-docs repository
    if (payload.repository.full_name !== 'getsentry/sentry-docs') {
      console.log('Ignoring non-sentry-docs repository:', payload.repository.full_name);
      return NextResponse.json({ message: 'Ignored non-sentry-docs repository' });
    }

    console.log(`Processing ${payload.commits.length} commits from sentry-docs`);

        // Process each commit
        for (const rawCommit of payload.commits) {
          try {
            // Debug: log the raw commit structure
            console.log('Raw commit keys:', Object.keys(rawCommit).join(', '));
            console.log('Raw commit.sha:', rawCommit.sha);
            console.log('Raw commit.id:', rawCommit.id);
            
            // Normalize commit structure (GitHub API returns different formats)
            const commit = {
              id: rawCommit.sha || rawCommit.id || '',
              message: rawCommit.commit?.message || rawCommit.message || '',
              timestamp: rawCommit.commit?.author?.date || rawCommit.timestamp || new Date().toISOString(),
              url: rawCommit.html_url || rawCommit.url || '',
              author: {
                name: rawCommit.commit?.author?.name || rawCommit.author?.name || 'Unknown',
                email: rawCommit.commit?.author?.email || rawCommit.author?.email || '',
              },
              added: rawCommit.added || [],
              removed: rawCommit.removed || [],
              modified: rawCommit.modified || [],
            };
            
            console.log(`Normalized commit: ${commit.id} - ${commit.message.substring(0, 50)}`);
            
            if (!commit.id) {
              console.error('Commit ID is empty after normalization, skipping');
              continue;
            }
            
            const { processDocsChanges } = await import('../../../../utils/githubProcessor');
            await processDocsChanges(commit);
            console.log(`Successfully processed commit: ${commit.id}`);
          } catch (error) {
            console.error(`Error processing commit:`, error);
            console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
            // Continue without processing - webhook still succeeds
          }
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
