#!/usr/bin/env node
/**
 * Automated PR Creation Script
 * 
 * This script creates a GitHub Pull Request from the feature branch to main.
 * 
 * Usage:
 *   1. Set GITHUB_TOKEN environment variable:
 *      Windows: set GITHUB_TOKEN=your_token_here
 *      Mac/Linux: export GITHUB_TOKEN=your_token_here
 *   
 *   2. Run: node create-pr-automated.js
 * 
 * Or pass token directly:
 *   node create-pr-automated.js YOUR_TOKEN_HERE
 */

const https = require('https');

const owner = 'ferdiebotden-ai';
const repo = 'WellnessApp';
const token = process.argv[2] || process.env.GITHUB_TOKEN;

if (!token) {
  console.error('\n❌ ERROR: GitHub token required');
  console.error('\nOption 1: Set environment variable');
  console.error('  Windows: set GITHUB_TOKEN=your_token_here');
  console.error('  Mac/Linux: export GITHUB_TOKEN=your_token_here');
  console.error('\nOption 2: Pass as argument');
  console.error('  node create-pr-automated.js YOUR_TOKEN_HERE');
  console.error('\nGet token from: https://github.com/settings/tokens');
  console.error('Required scope: repo (for private repos) or public_repo (for public repos)');
  process.exit(1);
}

const prData = JSON.stringify({
  title: 'chore: update codebase with latest changes',
  head: 'feature/update-codebase-with-latest-changes',
  base: 'main',
  body: `## Changes

This PR updates the codebase with the following changes:

- ✅ Added feature flags system (hooks, providers, services)
- ✅ Added test files (Jest for backend, Playwright for E2E)
- ✅ Added database migration for social/anonymous preference
- ✅ Added CI/CD workflow configuration
- ✅ Updated client configuration files
- ✅ Added .gitignore to exclude build artifacts

## Testing

Tests will run automatically via GitHub Actions when this PR is created.

## Checklist

- [x] Code follows project conventions
- [x] Tests written (not executed - GitHub Actions will run them)
- [x] Feature branch created and pushed
- [ ] PR created (this script)
- [ ] Tests pass in CI
- [ ] Code reviewed
- [ ] Merged to main`
});

const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/pulls`,
  method: 'POST',
  headers: {
    'Authorization': `token ${token}`,
    'User-Agent': 'WellnessApp-PR-Creator',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'Content-Length': prData.length
  }
};

console.log('\n🔄 Creating Pull Request...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 201) {
      const pr = JSON.parse(data);
      console.log('✅ Pull Request created successfully!\n');
      console.log(`📋 Title: ${pr.title}`);
      console.log(`🔗 URL: ${pr.html_url}`);
      console.log(`📊 Number: #${pr.number}\n`);
      console.log('Next steps:');
      console.log('1. Review the PR on GitHub');
      console.log('2. Wait for GitHub Actions to run tests');
      console.log('3. Merge when tests pass and code is approved\n');
    } else {
      console.error(`❌ ERROR: Failed to create PR (Status: ${res.statusCode})\n`);
      try {
        const error = JSON.parse(data);
        console.error('Error details:', error.message || error);
        if (error.errors) {
          error.errors.forEach((err: { message: string }) => {
            console.error('  -', err.message);
          });
        }
      } catch (e) {
        console.error('Response:', data);
      }
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Network ERROR:', error.message);
  process.exit(1);
});

req.write(prData);
req.end();

