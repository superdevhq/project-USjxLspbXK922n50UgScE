
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ScraperRequest {
  url: string;
  postId?: string; // Optional: for scraping comments of a specific post
  limit?: number; // Optional: limit number of posts/comments to scrape
  credentials?: {
    email: string;
    password: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { url, postId, limit = 10, credentials } = await req.json() as ScraperRequest;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Facebook page URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine what to scrape
    const scrapeMode = postId ? 'comments' : 'posts';
    
    // Launch browser with stealth mode to avoid detection
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    });

    try {
      const page = await browser.newPage();
      
      // Set user agent to mimic real browser
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Login if credentials are provided
      if (credentials?.email && credentials?.password) {
        await loginToFacebook(page, credentials.email, credentials.password);
      }

      // Scrape based on mode
      let result;
      if (scrapeMode === 'posts') {
        result = await scrapePosts(page, url, limit);
      } else {
        result = await scrapeComments(page, url, postId!, limit);
      }

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to scrape data', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function loginToFacebook(page, email, password) {
  try {
    // Navigate to Facebook login page
    await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });
    
    // Check for and accept cookies if the dialog appears
    try {
      const cookieButton = await page.$('button[data-cookiebanner="accept_button"]');
      if (cookieButton) {
        await cookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // Ignore if cookie dialog doesn't appear
    }
    
    // Fill in email and password
    await page.type('#email', email);
    await page.type('#pass', password);
    
    // Click login button
    await Promise.all([
      page.click('#loginbutton'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Check if login was successful
    const url = page.url();
    if (url.includes('login') || url.includes('checkpoint')) {
      throw new Error('Login failed. Check credentials or handle 2FA.');
    }
    
    // Wait a moment for the page to fully load
    await page.waitForTimeout(2000);
    
    console.log('Successfully logged in to Facebook');
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(`Failed to login: ${error.message}`);
  }
}

async function scrapePosts(page, pageUrl, limit) {
  try {
    // Navigate to the Facebook page
    await page.goto(pageUrl, { waitUntil: 'networkidle2' });
    
    // Wait for posts to load
    await page.waitForSelector('[role="article"]', { timeout: 10000 });
    
    // Scroll to load more posts
    await autoScroll(page, 3); // Scroll 3 times to load more posts
    
    // Extract posts
    const posts = await page.evaluate((postLimit) => {
      const postElements = Array.from(document.querySelectorAll('[role="article"]'));
      
      return postElements.slice(0, postLimit).map((post, index) => {
        // Extract post content
        const contentElement = post.querySelector('div[data-ad-comet-preview="message"]');
        const content = contentElement ? contentElement.textContent : '';
        
        // Extract post date
        const dateElement = post.querySelector('a[role="link"] > span > span > span');
        const dateText = dateElement ? dateElement.textContent : '';
        
        // Extract post URL
        const linkElement = post.querySelector('a[role="link"][href*="/posts/"]');
        const postUrl = linkElement ? linkElement.href : '';
        
        // Extract post ID from URL
        const postId = postUrl ? postUrl.match(/\/posts\/(\d+)/) ? postUrl.match(/\/posts\/(\d+)/)[1] : `unknown-${index}` : `unknown-${index}`;
        
        // Extract engagement metrics
        const metricsContainer = post.querySelectorAll('[role="button"]');
        let likes = 0;
        let comments = 0;
        let shares = 0;
        
        metricsContainer.forEach(button => {
          const text = button.textContent.toLowerCase();
          if (text.includes('like')) {
            const match = text.match(/(\d+)/);
            likes = match ? parseInt(match[1]) : 0;
          } else if (text.includes('comment')) {
            const match = text.match(/(\d+)/);
            comments = match ? parseInt(match[1]) : 0;
          } else if (text.includes('share')) {
            const match = text.match(/(\d+)/);
            shares = match ? parseInt(match[1]) : 0;
          }
        });
        
        return {
          id: postId,
          content,
          date: dateText,
          postUrl,
          likes,
          comments,
          shares
        };
      });
    }, limit);
    
    return { 
      success: true, 
      data: posts,
      count: posts.length,
      pageUrl
    };
  } catch (error) {
    console.error('Error scraping posts:', error);
    throw new Error(`Failed to scrape posts: ${error.message}`);
  }
}

async function scrapeComments(page, pageUrl, postId, limit) {
  try {
    // Construct the post URL if it's not a full URL
    const postUrl = pageUrl.includes('/posts/') ? pageUrl : `${pageUrl}/posts/${postId}`;
    
    // Navigate to the post
    await page.goto(postUrl, { waitUntil: 'networkidle2' });
    
    // Wait for comments to load
    await page.waitForSelector('[role="article"]', { timeout: 10000 });
    
    // Click "View more comments" buttons to expand comments
    try {
      const viewMoreSelector = 'div[role="button"]:has-text("View more comments")';
      for (let i = 0; i < 3; i++) { // Try to expand comments 3 times
        const viewMoreButton = await page.$(viewMoreSelector);
        if (viewMoreButton) {
          await viewMoreButton.click();
          await page.waitForTimeout(1500);
        } else {
          break;
        }
      }
    } catch (e) {
      // Ignore if we can't expand more comments
      console.log('No more comments to expand or error expanding comments');
    }
    
    // Extract comments
    const comments = await page.evaluate((commentLimit) => {
      // Skip the first article which is the post itself
      const commentElements = Array.from(document.querySelectorAll('[role="article"]')).slice(1);
      
      return commentElements.slice(0, commentLimit).map((comment, index) => {
        // Extract author name
        const authorElement = comment.querySelector('a[role="link"] > span');
        const author = authorElement ? authorElement.textContent : 'Unknown';
        
        // Extract author ID/profile link
        const authorLinkElement = comment.querySelector('a[role="link"][href*="facebook.com"]');
        const authorUrl = authorLinkElement ? authorLinkElement.href : '';
        const authorId = authorUrl ? authorUrl.split('/').pop() : `unknown-${index}`;
        
        // Extract comment content
        const contentElement = comment.querySelector('div[dir="auto"]');
        const content = contentElement ? contentElement.textContent : '';
        
        // Extract comment date
        const dateElement = comment.querySelector('a[role="link"] > span:last-child');
        const date = dateElement ? dateElement.textContent : '';
        
        // Extract likes
        const likesElement = comment.querySelector('span[aria-label*="Like"]');
        let likes = 0;
        if (likesElement) {
          const likesText = likesElement.textContent;
          const match = likesText.match(/(\d+)/);
          likes = match ? parseInt(match[1]) : 0;
        }
        
        return {
          id: `comment-${index}`,
          author,
          authorId,
          content,
          date,
          likes
        };
      });
    }, limit);
    
    return { 
      success: true, 
      data: comments,
      count: comments.length,
      postUrl
    };
  } catch (error) {
    console.error('Error scraping comments:', error);
    throw new Error(`Failed to scrape comments: ${error.message}`);
  }
}

async function autoScroll(page, scrollCount = 5) {
  await page.evaluate(async (count) => {
    for (let i = 0; i < count; i++) {
      window.scrollBy(0, window.innerHeight);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, scrollCount);
  
  // Wait a bit after scrolling
  await page.waitForTimeout(1000);
}
