
import { useState } from "react";
import { extractPostsFromPage, isValidFacebookUrl, downloadAsFile, exportAsJson, exportAsCsv, Post } from "@/lib/facebook-scraper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export function SimplifiedFacebookScraper() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const handleExtractPosts = async () => {
    if (!url) {
      setError("Please enter a Facebook page URL");
      return;
    }

    if (!isValidFacebookUrl(url)) {
      setError("Please enter a valid Facebook URL");
      return;
    }

    setLoading(true);
    setError(null);
    setPosts([]);

    try {
      const extractedPosts = await extractPostsFromPage({ url });
      setPosts(extractedPosts);
      if (extractedPosts.length === 0) {
        setError("No posts found on this page");
      }
    } catch (err) {
      console.error("Error extracting posts:", err);
      setError(err instanceof Error ? err.message : "Failed to extract posts");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (data: any[], type: 'json' | 'csv', filename: string) => {
    if (data.length === 0) return;
    
    const content = type === 'json' ? exportAsJson(data) : exportAsCsv(data);
    downloadAsFile(content, filename, type);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Facebook Page Scraper</CardTitle>
          <CardDescription>
            Extract posts from any public Facebook page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Facebook page URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleExtractPosts} disabled={loading}>
              {loading ? "Extracting..." : "Extract Posts"}
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {(posts.length > 0 || loading) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Posts</CardTitle>
              <CardDescription>
                {posts.length > 0 ? `${posts.length} posts extracted from ${url}` : "No posts found"}
              </CardDescription>
            </div>
            {posts.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport(posts, 'json', 'facebook-posts.json')}>
                  Export JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport(posts, 'csv', 'facebook-posts.csv')}>
                  Export CSV
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="p-4">
                    <div className="mb-2 text-sm text-muted-foreground">{post.date}</div>
                    <div className="mb-3">{post.content}</div>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <Badge variant="outline">{post.likes} likes</Badge>
                      <Badge variant="outline">{post.comments} comments</Badge>
                      <Badge variant="outline">{post.shares} shares</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
