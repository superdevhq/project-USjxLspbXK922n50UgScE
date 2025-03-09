
import { supabase } from "@/integrations/supabase/client";

export interface Post {
  id: string;
  content: string;
  date: string;
  postUrl?: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface Comment {
  id: string;
  author: string;
  authorId?: string;
  content: string;
  date: string;
  likes: number;
}

interface ScraperOptions {
  url: string;
  postId?: string;
  limit?: number;
  credentials?: {
    email: string;
    password: string;
  };
}

/**
 * Extract posts from a Facebook page using Supabase Edge Function
 */
export const extractPostsFromPage = async (options: ScraperOptions): Promise<Post[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('facebook-scraper', {
      body: {
        url: options.url,
        limit: options.limit || 10,
        credentials: options.credentials
      }
    });

    if (error) {
      console.log("Error extracting posts:", error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to extract posts');
    }

    return data.data.map((post: any) => ({
      id: post.id,
      content: post.content,
      date: post.date,
      postUrl: post.postUrl,
      likes: post.likes || 0,
      comments: post.comments || 0,
      shares: post.shares || 0
    }));
  } catch (error) {
    console.log("Error in extractPostsFromPage:", error);
    throw error;
  }
};

/**
 * Extract comments from a Facebook post using Supabase Edge Function
 */
export const extractCommentsFromPost = async (options: ScraperOptions): Promise<Comment[]> => {
  try {
    if (!options.postId) {
      throw new Error('Post ID is required to extract comments');
    }

    const { data, error } = await supabase.functions.invoke('facebook-scraper', {
      body: {
        url: options.url,
        postId: options.postId,
        limit: options.limit || 20,
        credentials: options.credentials
      }
    });

    if (error) {
      console.log("Error extracting comments:", error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to extract comments');
    }

    return data.data.map((comment: any) => ({
      id: comment.id,
      author: comment.author,
      authorId: comment.authorId,
      content: comment.content,
      date: comment.date,
      likes: comment.likes || 0
    }));
  } catch (error) {
    console.log("Error in extractCommentsFromPost:", error);
    throw error;
  }
};

// Utility function to validate Facebook URLs
export const isValidFacebookUrl = (url: string): boolean => {
  // Basic validation - could be enhanced with regex for more precise validation
  return url.includes('facebook.com') || url.includes('fb.com');
};

// Utility function to export data as JSON
export const exportAsJson = (data: any): string => {
  return JSON.stringify(data, null, 2);
};

// Utility function to export data as CSV
export const exportAsCsv = (data: any[]): string => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(value => 
      typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

// Function to download data as a file
export const downloadAsFile = (data: string, filename: string, type: 'json' | 'csv') => {
  const blob = new Blob([data], { type: type === 'json' ? 'application/json' : 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
