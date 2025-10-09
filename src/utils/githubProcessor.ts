import { saveChangelogEntry as saveToStorage } from './changelogStorage';

// Lazy imports to handle missing dependencies
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let octokit: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let openai: any = null;

// Initialize GitHub client lazily
async function getOctokit() {
  if (octokit) return octokit;
  
  if (!process.env.GITHUB_TOKEN) {
    console.log('GITHUB_TOKEN not configured, GitHub integration disabled');
    return null;
  }

  try {
    const { Octokit } = await import('@octokit/rest');
    octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    return octokit;
  } catch {
    console.log('@octokit/rest not available, GitHub integration disabled');
    return null;
  }
}

// Initialize OpenAI client lazily
async function getOpenAI() {
  if (openai) return openai;
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('OPENAI_API_KEY not configured, AI summaries disabled');
    return null;
  }

  try {
    const OpenAI = (await import('openai')).default;
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai;
  } catch {
    console.log('openai not available, AI summaries disabled');
    return null;
  }
}

interface Commit {
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
}


interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: 'changelog';
  categories: string[];
  commitId: string;
  author: string;
  filesChanged: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  aiSummary: string;
}


export async function processDocsChanges(commit: Commit): Promise<void> {
  try {
    const octokitClient = await getOctokit();
    if (!octokitClient) {
      console.log('GitHub integration not configured, skipping commit processing');
      return;
    }

    console.log(`Processing commit ${commit.id}: ${commit.message}`);

    // Get detailed commit information
    const commitDetails = await octokitClient.rest.repos.getCommit({
      owner: 'getsentry',
      repo: 'sentry-docs',
      ref: commit.id,
    });

    const totalFiles = commitDetails.data.files?.length || 0;
    console.log(`Commit has ${totalFiles} total files changed`);
    
    // Log some file names for debugging
    if (totalFiles > 0 && commitDetails.data.files) {
      const sampleFiles = commitDetails.data.files.slice(0, 3).map((f: {filename: string}) => f.filename);
      console.log(`Sample files: ${sampleFiles.join(', ')}`);
    }

    // Filter for documentation files only
    const docFiles = commitDetails.data.files?.filter((file: { filename: string }) => 
      file.filename.endsWith('.md') || 
      file.filename.endsWith('.mdx') ||
      file.filename.includes('/docs/') ||
      file.filename.includes('/documentation/')
    ) || [];

    console.log(`Found ${docFiles.length} documentation files`);
    
    if (docFiles.length === 0) {
      console.log('No documentation files changed in this commit');
      return;
    }

    // Generate AI summary of changes
    const aiSummary = await generateAISummary(commit, docFiles);

    // Create changelog entry
    const changelogEntry: ChangelogEntry = {
      id: `docs-${commit.id}`,
      title: `Docs Update: ${commit.message.split('\n')[0]}`,
      description: aiSummary,
      url: commit.url,
      publishedAt: commit.timestamp,
      source: 'changelog',
      categories: ['technical', 'documentation'],
      commitId: commit.id,
      author: commit.author.name,
      filesChanged: {
        added: commit.added.filter(file => 
          file.endsWith('.md') || file.endsWith('.mdx') || file.includes('/docs/')
        ),
        removed: commit.removed.filter(file => 
          file.endsWith('.md') || file.endsWith('.mdx') || file.includes('/docs/')
        ),
        modified: commit.modified.filter(file => 
          file.endsWith('.md') || file.endsWith('.mdx') || file.includes('/docs/')
        ),
      },
      aiSummary,
    };

    // Save to storage (Vercel KV in production, file in development)
    await saveToStorage(changelogEntry);

    console.log(`Successfully processed commit ${commit.id}`);

  } catch (error) {
    console.error(`Error processing commit ${commit.id}:`, error);
  }
}

async function generateAISummary(commit: Commit, files: { filename: string; status: string; additions?: number; deletions?: number; changes?: number; patch?: string }[]): Promise<string> {
  try {
    const openaiClient = await getOpenAI();
    if (!openaiClient) {
      console.warn('OpenAI API key not configured, using fallback summary');
      return `Documentation changes in ${files.length} file(s): ${files.map(f => f.filename).join(', ')}`;
    }

    // Prepare file changes for AI analysis
    const fileChanges = files.map((file: { filename: string; status: string; additions?: number; deletions?: number; changes?: number; patch?: string }) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
    }));

    const prompt = `Summarize this Sentry docs change in ONE sentence (max 168 characters). Be specific and focus on what changed:

Commit: ${commit.message}
Files: ${fileChanges.map(f => f.filename.split('/').pop()).join(', ')}

Keep it brief, clear, and actionable.`;

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a technical writer. Create ultra-concise, single-sentence summaries under 168 characters. No fluff, just facts about what changed and why."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 80,
      temperature: 0.2,
    });

    return completion.choices[0]?.message?.content || 'Documentation updated with various improvements.';

  } catch (error) {
    console.error('Error generating AI summary:', error);
    return `Documentation changes in ${files.length} file(s): ${files.map(f => f.filename).join(', ')}`;
  }
}

