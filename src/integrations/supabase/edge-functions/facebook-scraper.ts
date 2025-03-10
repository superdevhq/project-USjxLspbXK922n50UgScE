
// Facebook scraper using Apify API

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// This is our main function that handles requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const requestData = await req.json();
    const url = requestData.url;
    const postId = requestData.postId;
    const limit = requestData.limit || 10;
    
    // Get Apify API token from environment variable
    const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN');
    
    if (!APIFY_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Apify API token is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Facebook page URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine what to scrape
    const scrapeMode = postId ? 'comments' : 'posts';
    
    let result;
    
    if (scrapeMode === 'posts') {
      // Use Apify's Facebook Pages Scraper
      const response = await fetch('https://api.apify.com/v2/acts/apify~facebook-pages-scraper/run-sync-get-dataset-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APIFY_API_TOKEN}`
        },
        body: JSON.stringify({
          "startUrls": [{ "url": url }],
          "maxPosts": limit,
          "commentsMode": "NONE", // We don't need comments in this request
          "maxPostDate": new Date().toISOString(),
          "maxComments": 0,
          "maxCommentsDepth": 0
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify API error: ${response.status} ${errorText}`);
      }
      
      const apifyData = await response.json();
      
      // Transform Apify data to our format with safer property access
      const posts = apifyData.map(post => {
        // Generate a unique ID if postId or postUrl is not available
        let id = post.postId;
        if (!id && post.postUrl) {
          const urlParts = post.postUrl.split('/');
          id = urlParts[urlParts.length - 1] || `post-${Math.random().toString(36).substring(2, 10)}`;
        } else if (!id) {
          id = `post-${Math.random().toString(36).substring(2, 10)}`;
        }
        
        return {
          id: id,
          content: post.text || '',
          date: post.time || '',
          postUrl: post.postUrl || url,
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0
        };
      });
      
      result = {
        success: true,
        data: posts,
        count: posts.length,
        pageUrl: url
      };
    } else {
      // Use Apify's Facebook Comments Scraper
      const response = await fetch('https://api.apify.com/v2/acts/apify~facebook-comment-scraper/run-sync-get-dataset-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APIFY_API_TOKEN}`
        },
        body: JSON.stringify({
          "startUrls": [{ "url": url }],
          "maxComments": limit,
          "maxReplies": 0 // We don't need replies for now
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify API error: ${response.status} ${errorText}`);
      }
      
      const apifyData = await response.json();
      
      // Transform Apify data to our format with safer property access
      const comments = apifyData.map(comment => {
        // Generate a unique ID if commentId or commentUrl is not available
        let id = comment.commentId;
        if (!id && comment.commentUrl) {
          const urlParts = comment.commentUrl.split('/');
          id = urlParts[urlParts.length - 1] || `comment-${Math.random().toString(36).substring(2, 10)}`;
        } else if (!id) {
          id = `comment-${Math.random().toString(36).substring(2, 10)}`;
        }
        
        // Extract authorId safely
        let authorId;
        if (comment.profileUrl) {
          const urlParts = comment.profileUrl.split('/');
          authorId = urlParts[urlParts.length - 1] || undefined;
        }
        
        return {
          id: id,
          author: comment.name || 'Unknown',
          authorId: authorId,
          content: comment.text || '',
          date: comment.time || '',
          likes: comment.likes || 0
        };
      });
      
      result = {
        success: true,
        data: comments,
        count: comments.length,
        postUrl: url
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to scrape data', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
