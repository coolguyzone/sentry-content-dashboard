import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function POST() {
  try {
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 400 }
      );
    }

    // Get recent commits from sentry-docs master branch
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner: 'getsentry',
      repo: 'sentry-docs',
      branch: 'master',
      per_page: 10,
    });

    console.log(`Found ${commits.length} recent commits`);

    // Process each commit
    const results = [];
    for (const commit of commits) {
      try {
        // Get detailed commit information
        const { data: commitDetails } = await octokit.rest.repos.getCommit({
          owner: 'getsentry',
          repo: 'sentry-docs',
          ref: commit.sha,
        });

        // Check if any documentation files were changed
        const docFiles = commitDetails.files?.filter(file => 
          file.filename.endsWith('.md') || 
          file.filename.endsWith('.mdx') ||
          file.filename.includes('/docs/') ||
          file.filename.includes('/documentation/')
        ) || [];

        if (docFiles.length > 0) {
          results.push({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author?.name,
            date: commit.commit.author?.date,
            filesChanged: docFiles.length,
            files: docFiles.map(f => f.filename),
          });
        }
      } catch (error) {
        console.error(`Error processing commit ${commit.sha}:`, error);
      }
    }

    return NextResponse.json({
      message: 'Manual trigger completed',
      commitsProcessed: results.length,
      results,
    });

  } catch (error) {
    console.error('Error in manual trigger:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger GitHub processing',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GitHub trigger endpoint is active',
    usage: 'POST to this endpoint to manually process recent commits',
    timestamp: new Date().toISOString(),
  });
}
