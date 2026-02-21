/**
 * Fix 24 Starliner reports that have "Security Notice Unsupported Browser" 
 * instead of actual content. Re-scrapes from Wayback Machine.
 */
import fs from 'fs';
import { extract } from '@extractus/article-extractor';

const REPORTS_FILE = 'public/data/news-reports.json';
const NEEDLE = 'Unsupported Browser';
const DELAY = 2000; // 2s between requests to be polite to archive.org

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Clean extracted content - remove Wayback/nav cruft
function cleanContent(text) {
  if (!text) return null;
  
  // Remove common Wayback Machine / site chrome patterns
  const removePatterns = [
    /Skip to (?:primary )?(?:navigation|content|sidebar|custom navigation)\s*/gi,
    /Search SEARCH MENU.*?Mission Updates\s*\|\s*/gi,
    /## Primary Sidebar[\s\S]*$/i,  // Everything after sidebar starts
    /## Additional Links[\s\S]*$/i,
    /Quick Links[\s\S]*$/i,
    /We use cookies[\s\S]*?Privacy policy/gi,
    /Reject Cookies\s*Accept Cookies[\s\S]*?Cookie Settings/gi,
    /© \d{4}\. Powered by Jetty.*/gi,
    /Manage My Subscriptions/gi,
    /Starliner Updates\s*Search SEARCH MENU/gi,
    /https:\/\/starlinerupdates\.com\/.*?Go\[\d+ captures\][\s\S]*?\.\.\./gi,
    /web\.archive\.org\/web\/\d+\//g,
  ];
  
  let cleaned = text;
  for (const pat of removePatterns) {
    cleaned = cleaned.replace(pat, '');
  }
  
  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  // If too short after cleaning, it failed
  if (cleaned.length < 50) return null;
  
  return cleaned;
}

async function main() {
  const reports = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8'));
  const bad = reports.filter(r => r.content && r.content.includes(NEEDLE));
  
  console.log(`Found ${bad.length} reports with bad content to fix`);
  console.log('');
  
  let fixed = 0;
  let failed = 0;
  
  for (let i = 0; i < bad.length; i++) {
    const report = bad[i];
    const slug = report.url.replace('https://starlinerupdates.com/', '').replace(/\/$/, '');
    
    // Try multiple Wayback Machine snapshots
    const waybackUrls = [
      `https://web.archive.org/web/2024/${report.url}`,
      `https://web.archive.org/web/2025/${report.url}`,
      `https://web.archive.org/web/20240901000000*/${report.url}`,
    ];
    
    console.log(`[${i+1}/${bad.length}] ${report.title}`);
    
    let content = null;
    
    for (const wbUrl of waybackUrls) {
      try {
        const result = await extract(wbUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (result && result.content) {
          // Strip HTML tags to get plain text
          const plainText = result.content
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#8217;/g, "'")
            .replace(/&#8220;|&#8221;/g, '"')
            .replace(/&#8211;/g, '–')
            .replace(/&#8230;/g, '...')
            .replace(/\s+/g, ' ')
            .trim();
          
          content = cleanContent(plainText);
          if (content && content.length > 100) {
            break; // Got good content
          }
        }
      } catch (err) {
        // Try next URL
      }
      
      await sleep(1000);
    }
    
    // Find this report in the main array and update
    const idx = reports.findIndex(r => r.id === report.id);
    if (idx === -1) continue;
    
    if (content && content.length > 100) {
      reports[idx].content = content;
      reports[idx].word_count = content.split(/\s+/).length;
      fixed++;
      console.log(`  ✓ Fixed! ${content.length} chars, ${reports[idx].word_count} words`);
    } else {
      // Remove the bad content entirely - better to have null than the error message
      reports[idx].content = null;
      reports[idx].word_count = 0;
      failed++;
      console.log(`  ✗ Could not recover - cleared bad content`);
    }
    
    await sleep(DELAY);
  }
  
  // Also check for any remaining articles/blogs with same issue  
  console.log('');
  console.log(`Results: ${fixed} fixed, ${failed} cleared`);
  
  // Save
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
  console.log(`Saved ${REPORTS_FILE}`);
  
  // Verify no more bad content
  const verify = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8'));
  const remaining = verify.filter(r => r.content && r.content.includes(NEEDLE));
  console.log(`Remaining bad content: ${remaining.length}`);
}

main().catch(console.error);
