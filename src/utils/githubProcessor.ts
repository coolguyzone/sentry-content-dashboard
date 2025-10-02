import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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

const CHANGELOG_FILE = path.join(process.cwd(), 'data', 'docs-changelog.json');

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

    // Filter for documentation files only
    const docFiles = commitDetails.data.files?.filter((file: { filename: string }) => 
      file.filename.endsWith('.md') || 
      file.filename.endsWith('.mdx') ||
      file.filename.includes('/docs/') ||
      file.filename.includes('/documentation/')
    ) || [];

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

    // Save to changelog file
    await saveChangelogEntry(changelogEntry);

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

    const prompt = `Analyze these documentation changes from the Sentry docs repository and provide a brief, user-friendly summary (2-3 sentences max):

Commit Message: ${commit.message}
Files Changed: ${fileChanges.length}
Author: ${commit.author.name}

File Details:
${fileChanges.map(f => `- ${f.filename} (${f.status}): +${f.additions} -${f.deletions} lines`).join('\n')}

Please provide a concise summary focusing on what documentation was updated and why it might be important to users.`;

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a technical writer who creates clear, concise summaries of documentation changes. Focus on user impact and key improvements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content || 'Documentation updated with various improvements.';

  } catch (error) {
    console.error('Error generating AI summary:', error);
    return `Documentation changes in ${files.length} file(s): ${files.map(f => f.filename).join(', ')}`;
  }
}

async function saveChangelogEntry(entry: ChangelogEntry): Promise<void> {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(CHANGELOG_FILE);
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    // Load existing changelog entries
    let existingEntries: ChangelogEntry[] = [];
    if (existsSync(CHANGELOG_FILE)) {
      const fileContent = await readFile(CHANGELOG_FILE, 'utf-8');
      existingEntries = JSON.parse(fileContent);
    }

    // Add new entry at the beginning (most recent first)
    existingEntries.unshift(entry);

    // Keep only the last 100 entries to prevent file from growing too large
    const limitedEntries = existingEntries.slice(0, 100);

    // Save back to file
    await writeFile(CHANGELOG_FILE, JSON.stringify(limitedEntries, null, 2));

    console.log(`Saved changelog entry for commit ${entry.commitId}`);

  } catch (error) {
    console.error('Error saving changelog entry:', error);
  }
}

export async function getDocsChangelog(): Promise<ChangelogEntry[]> {
  try {
    if (!existsSync(CHANGELOG_FILE)) {
      return [];
    }

    const fileContent = await readFile(CHANGELOG_FILE, 'utf-8');
    return JSON.parse(fileContent);

  } catch (error) {
    console.error('Error loading docs changelog:', error);
    return [];
  }
}
