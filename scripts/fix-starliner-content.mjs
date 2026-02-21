import fs from 'fs';
import { extract } from '@extractus/article-extractor';

const REPORTS_FILE = 'public/data/news-reports.json';
const BAD_PHRASE = 'Security Notice Unsupported Browser';

// Read reports
const reports = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8'));
const badReports = reports.filter(r => r.content && r.content.includes(BAD_PHRASE));

console.log(`Found ${badReports.length} reports with bad content to fix\n`);

// Try Wayback Machine snapshots
async function tryWayback(url) {
  const waybackUrl = `https://web.archive.org/web/2024/${url}`;
  try {
    const article = await extract(waybackUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (article && article.content) {
      // Strip HTML tags for plain text
      const text = article.content
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      return text;
    }
  } catch (e) {
    // Try alternate year
    try {
      const waybackUrl2 = `https://web.archive.org/web/2025/${url}`;
      const article = await extract(waybackUrl2, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (article && article.content) {
        const text = article.content
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
        return text;
      }
    } catch (e2) {
      // ignore
    }
  }
  return null;
}

// Process one at a time with delay
let fixed = 0;
let failed = 0;

for (let i = 0; i < badReports.length; i++) {
  const report = badReports[i];
  console.log(`[${i + 1}/${badReports.length}] ${report.title.substring(0, 60)}...`);
  
  const content = await tryWayback(report.url);
  
  if (content && content.length > 100) {
    // Find report in main array and update
    const idx = reports.findIndex(r => r.id === report.id);
    if (idx >= 0) {
      // Clean: remove Wayback Machine artifacts
      let cleaned = content
        .replace(/https?:\/\/web\.archive\.org\/web\/\d+\//g, '')
        .replace(/Skip to primary navigation/g, '')
        .replace(/Skip to content/g, '')
        .replace(/Skip to primary sidebar/g, '')
        .replace(/Skip to custom navigation/g, '')
        .replace(/Starliner Updates/g, '')
        .replace(/SEARCH MENU/g, '')
        .replace(/Primary Sidebar/g, '')
        .replace(/Quick Links.*$/s, '') // Remove sidebar content from end
        .replace(/Boeing Newsroom Contacts.*$/s, '')
        .replace(/Additional Links.*$/s, '')
        .replace(/We use cookies.*$/s, '')
        .replace(/© \d{4}\..*/s, '')
        .replace(/Reject Cookies.*Accept Cookies/g, '')
        .replace(/Cookie Settings/g, '')
        .replace(/Privacy policy/g, '')
        .replace(/Save my preferences/g, '')
        .replace(/Highest level of privacy.*?device/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      reports[idx].content = cleaned;
      const words = cleaned.split(/\s+/).length;
      reports[idx].content_word_count = words;
      console.log(`  ✓ Fixed! ${words} words`);
      fixed++;
    }
  } else {
    console.log(`  ✗ Failed to recover`);
    // Null out the bad content so UI doesn't show it
    const idx = reports.findIndex(r => r.id === report.id);
    if (idx >= 0) {
      reports[idx].content = null;
      reports[idx].content_word_count = 0;
    }
    failed++;
  }
  
  // Rate limit delay
  await new Promise(r => setTimeout(r, 2000));
}

// Save
fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
console.log(`\nDone! Fixed: ${fixed}, Failed (nulled out): ${failed}`);
