#!/usr/bin/env tsx

/**
 * FOMC Statement Scraper
 *
 * Scrapes FOMC statements from the Federal Reserve website and generates
 * Markdown files with YAML frontmatter for use in the statement tracker.
 * Supports years 2006-present, automatically handling different page formats.
 *
 * Usage: npm run scrape -- [--year=2024] [--verbose]
 */

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

interface ScrapedStatement {
  id: string;
  date: string;
  title: string;
  type: 'meeting' | 'longer-run-goals' | 'minutes' | 'other';
  url: string;
  content: string;
}

const BASE_URL = 'https://www.federalreserve.gov';
const PRESS_RELEASE_BASE = `${BASE_URL}/newsevents/pressreleases`;

// Parse command line arguments
const args = process.argv.slice(2);
const yearArg = args.find(arg => arg.startsWith('--year='));
const verbose = args.includes('--verbose');
const targetYear = yearArg ? yearArg.split('=')[1] : new Date().getFullYear().toString();

function log(message: string) {
  if (verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

function normalizeId(date: string, title: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/federal reserve issues fomc statement/i, 'fomc-statement')
    .replace(/statement on longer-run goals/i, 'longer-run-goals')
    .replace(/minutes of the federal open market committee/i, 'fomc-minutes')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${date}-${cleanTitle}`;
}

function classifyStatementType(title: string, content: string): 'meeting' | 'longer-run-goals' | 'minutes' | 'other' {
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();

  // Check for economic projections (skip these)
  if (titleLower.includes('economic projections') || 
      titleLower.includes('summary of economic projections') ||
      contentLower.includes('economic projections')) {
    return 'other';
  }

  // Check for longer-run goals first (most specific)
  if (titleLower.includes('longer-run goals') || titleLower.includes('longer run goals')) {
    return 'longer-run-goals';
  }

  // Check for meeting minutes
  if (titleLower.includes('minutes') || titleLower.includes('meeting minutes')) {
    return 'minutes';
  }

  // Default to meeting for FOMC statements
  // Most regular FOMC statements will have titles like "Federal Reserve issues FOMC statement"
  if (titleLower.includes('fomc statement') || 
      titleLower.includes('federal reserve issues fomc') ||
      titleLower.includes('federal open market committee') ||
      contentLower.includes('committee decided') ||
      contentLower.includes('target range for the federal funds rate')) {
    return 'meeting';
  }

  return 'other';
}

async function fetchPressReleasePage(year: string): Promise<string[]> {
  const yearNum = parseInt(year);
  let url: string;
  
  // Use different URL patterns for historical vs recent years
  if (yearNum <= 2019) {
    url = `${BASE_URL}/monetarypolicy/fomchistorical${year}.htm`;
  } else {
    url = `${PRESS_RELEASE_BASE}/${year}-press-fomc.htm`;
  }
  
  log(`Fetching FOMC press releases for ${year}: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const links: string[] = [];

    if (yearNum <= 2019) {
      // Historical pages: look for statement links
      $('a[href*="monetary"]').each((_, element) => {
        const href = $(element).attr('href');
        const linkText = $(element).text().toLowerCase();
        
        // Match both modern and historical URL patterns
        // Historical: /newsevents/press/monetary/20060131a.htm
        // Modern: /newsevents/pressreleases/monetary20241107a.htm
        const isMonetaryLink = href && (
          href.match(/monetary\/\d{8}[a-z]?\.htm/) ||  // Historical pattern
          href.match(/monetary\d{8}[a-z]?\.htm/)       // Modern pattern
        );
        
        // Only get statement links (not minutes, transcripts, etc.)
        if (isMonetaryLink && 
            (linkText.includes('statement') || linkText === '' || linkText.trim() === 'HTML')) {
          const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          links.push(fullUrl);
        }
      });
    } else {
      // Modern pages: look for FOMC-related press release links
      $('a[href*="monetary"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && href.match(/monetary\d{8}[a-z]?\.htm/)) {
          const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          links.push(fullUrl);
        }
      });
    }

    log(`Found ${links.length} FOMC press release links`);
    return links;
  } catch (error) {
    console.error(`Failed to fetch press releases for ${year}:`, error);
    return [];
  }
}

async function scrapeStatement(url: string): Promise<ScrapedStatement | null> {
  log(`Scraping statement: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title - try different selectors for historical vs modern pages
    let title = $('h3').first().text().trim();
    if (!title) {
      title = $('h1').first().text().trim();
    }
    if (!title) {
      title = $('title').text().trim().replace(' | Board of Governors of the Federal Reserve System', '');
    }
    
    // For historical pages, often the title is just "FRB: Press Release"
    if (title === 'FRB: Press Release' || title.includes('Press Release')) {
      title = 'Federal Reserve issues FOMC statement';
    }
    
    // Clean up title
    title = title.replace(/\s+/g, ' ').trim();

    // Extract date from URL or content
    // Handle both URL patterns:
    // Historical: /newsevents/press/monetary/20060131a.htm
    // Modern: /newsevents/pressreleases/monetary20241107a.htm
    const urlMatch = url.match(/monetary\/(\d{4})(\d{2})(\d{2})/) || url.match(/monetary(\d{4})(\d{2})(\d{2})/);
    let date = '';
    if (urlMatch) {
      const [, year, month, day] = urlMatch;
      date = `${year}-${month}-${day}`;
    }

    // If no date from URL, try to extract from content
    if (!date) {
      const dateText = $('.article__time, .release-date, time').first().text();
      const dateMatch = dateText.match(/(\d{4})-(\d{2})-(\d{2})|(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
      if (dateMatch) {
        if (dateMatch[1]) {
          date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        } else {
          // Convert "Month DD, YYYY" format
          const months: Record<string, string> = {
            january: '01', february: '02', march: '03', april: '04',
            may: '05', june: '06', july: '07', august: '08',
            september: '09', october: '10', november: '11', december: '12'
          };
          const month = months[dateMatch[4].toLowerCase()];
          if (month) {
            date = `${dateMatch[6]}-${month}-${dateMatch[5].padStart(2, '0')}`;
          }
        }
      }
    }

    if (!date) {
      console.warn(`Could not extract date from ${url}`);
      return null;
    }

    // Extract main content
    let content = '';

    // Try different selectors for content - historical vs modern pages
    const contentSelectors = [
      '.col-md-8 p',           // Modern pages
      '.article__body p',      // Modern pages 
      '.release-content p',    // Modern pages
      '#article p',            // Modern pages
      'main p',               // Modern pages
      'table[width="600"] p', // Historical pages often use table layouts
      'td p',                 // Historical pages table cells
      'font p',              // Historical pages sometimes wrap content in font tags
    ];

    for (const selector of contentSelectors) {
      const paragraphs = $(selector);
      if (paragraphs.length > 0) {
        content = paragraphs.map((_, el) => $(el).text().trim()).get().join('\n\n');
        break;
      }
    }

    // Fallback: get all paragraphs, but filter more carefully for historical pages
    if (!content) {
      content = $('p').map((_, el) => {
        const text = $(el).text().trim();
        // Skip navigation, header, and footer paragraphs common in historical pages
        if (text.includes('Home | News and events') || 
            text.includes('Last update:') ||
            text.includes('Board of Governors') ||
            text.length < 50) {
          return null;
        }
        return text;
      }).get()
      .filter(text => text !== null)
      .join('\n\n');
    }

    if (!content) {
      console.warn(`Could not extract content from ${url}`);
      return null;
    }

    // Clean up content while preserving paragraph breaks
    content = content
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .trim();

    const type = classifyStatementType(title, content);
    const id = normalizeId(date, title);

    return {
      id,
      date,
      title,
      type,
      url,
      content
    };

  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return null;
  }
}

async function generateMarkdown(statement: ScrapedStatement): Promise<string> {
  // Properly escape YAML values, especially titles that may contain colons
  const escapeYamlValue = (value: string): string => {
    // If value contains special YAML characters, quote it
    if (value.includes(':') || value.includes('"') || value.includes("'") || 
        value.includes('\n') || value.includes('#') || value.includes('[') || 
        value.includes(']') || value.includes('{') || value.includes('}')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  };

  const frontmatter = `---
id: ${statement.id}
date: ${statement.date}
title: ${escapeYamlValue(statement.title)}
type: ${statement.type}
url: ${statement.url}
---`;

  return `${frontmatter}\n\n${statement.content}`;
}

async function saveStatement(statement: ScrapedStatement) {
  const filename = `${statement.id}.md`;
  const filepath = path.join(process.cwd(), 'data', 'statements', filename);

  const markdown = await generateMarkdown(statement);
  await fs.writeFile(filepath, markdown, 'utf-8');

  console.log(`✓ Saved: ${filename}`);
}

async function main() {
  const yearNum = parseInt(targetYear);
  if (yearNum < 2006) {
    console.error('Error: This scraper only supports years 2006 and later');
    process.exit(1);
  }
  
  console.log(`🔍 Scraping FOMC meeting statements for ${targetYear}...`);

  try {
    // Ensure data directory exists
    await fs.mkdir(path.join(process.cwd(), 'data', 'statements'), { recursive: true });

    const urls = await fetchPressReleasePage(targetYear);

    if (urls.length === 0) {
      console.log('No FOMC press releases found');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const url of urls) {
      try {
        const statement = await scrapeStatement(url);
        if (statement) {
          // Only save regular meeting statements
          if (statement.type === 'meeting') {
            await saveStatement(statement);
            successCount++;
          } else {
            log(`Skipping non-meeting statement: ${statement.title} (type: ${statement.type})`);
          }

          // Be respectful to the server
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ Scraping complete!`);
    console.log(`📊 Successfully scraped: ${successCount} meeting statements`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount}`);
    }

  } catch (error) {
    console.error('Scraping failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
