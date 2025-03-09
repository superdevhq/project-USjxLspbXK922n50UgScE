
import { useState } from "react";
import { extractPostsFromPage, extractCommentsFromPost, isValidFacebookUrl, downloadAsFile, exportAsJson, exportAsCsv, Post, Comment } from "@/lib/facebook-scraper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export function FacebookScraper() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("posts");

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
    setSelectedPost(null);
    setComments([]);

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

  const handleSelectPost = async (post: Post) => {
    setSelectedPost(post);
    setLoadingComments(true);
    setCommentsError(null);
    setComments([]);
    setActiveTab("comments");

    try {
      const extractedComments = await extractCommentsFromPost({
        url: post.postUrl || "",
        postId: post.id,
      });
      setComments(extractedComments);
      if (extractedComments.length === 0) {
        setCommentsError("No comments found for this post");
      }
    } catch (err) {
      console.error("Error extracting comments:", err);
      setCommentsError(err instanceof Error ? err.message : "Failed to extract comments");
    } finally {
      setLoadingComments(false);
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
            Extract posts and comments from any public Facebook page
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="comments" disabled={!selectedPost}>
              Comments ({comments.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-4">
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
                      <Card key={post.id} className={`p-4 cursor-pointer transition-colors ${selectedPost?.id === post.id ? 'border-primary' : ''}`} onClick={() => handleSelectPost(post)}>
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
          </TabsContent>
          
          <TabsContent value="comments" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Comments</CardTitle>
                  <CardDescription>
                    {selectedPost ? `${comments.length} comments on post` : "Select a post to view comments"}
                  </CardDescription>
                </div>
                {comments.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport(comments, 'json', 'facebook-comments.json')}>
                      Export JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport(comments, 'csv', 'facebook-comments.csv')}>
                      Export CSV
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {selectedPost && (
                  <Card className="p-4 mb-4 bg-muted/50">
                    <div className="mb-2 text-sm text-muted-foreground">{selectedPost.date}</div>
                    <div className="mb-2">{selectedPost.content}</div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("posts")}>
                      Back to posts
                    </Button>
                  </Card>
                )}
                
                {loadingComments ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-1/4 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {commentsError && (
                      <Alert variant="destructive" className="mb-4">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{commentsError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                            {comment.author.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium">{comment.author}</div>
                              <div className="text-xs text-muted-foreground">{comment.date}</div>
                            </div>
                            <div className="text-sm">{comment.content}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {comment.likes} likes
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
