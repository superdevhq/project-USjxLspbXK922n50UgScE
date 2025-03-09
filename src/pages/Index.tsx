
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, Facebook } from "lucide-react";

interface Post {
  id: string;
  content: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  likes: number;
}

const Index = () => {
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  };

  const extractPosts = async () => {
    if (!url) {
      setError("Please enter a Facebook page URL");
      return;
    }

    if (!url.includes("facebook.com")) {
      setError("Please enter a valid Facebook page URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPosts([]);
    setSelectedPost(null);
    setComments([]);

    try {
      // This is a mock implementation since we can't actually scrape Facebook from the browser
      // In a real implementation, this would call your backend service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data for demonstration
      const mockPosts: Post[] = [
        {
          id: "1",
          content: "We're excited to announce our new product line coming next month!",
          date: "2023-05-15",
          likes: 245,
          comments: 37,
          shares: 12
        },
        {
          id: "2",
          content: "Thank you to everyone who attended our virtual event yesterday. The recording will be available soon.",
          date: "2023-05-10",
          likes: 189,
          comments: 24,
          shares: 8
        },
        {
          id: "3",
          content: "Check out our latest blog post on industry trends for 2023.",
          date: "2023-05-05",
          likes: 132,
          comments: 18,
          shares: 15
        }
      ];
      
      setPosts(mockPosts);
    } catch (err) {
      setError("Failed to extract posts. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const extractComments = async (post: Post) => {
    setSelectedPost(post);
    setIsLoadingComments(true);
    setComments([]);

    try {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock comments data
      const mockComments: Comment[] = [
        {
          id: "c1",
          author: "Jane Smith",
          content: "This is great news! Looking forward to seeing the new products.",
          date: "2023-05-15",
          likes: 12
        },
        {
          id: "c2",
          author: "John Doe",
          content: "Will there be a pre-order option available?",
          date: "2023-05-15",
          likes: 5
        },
        {
          id: "c3",
          author: "Alice Johnson",
          content: "I've been waiting for this update. Can't wait!",
          date: "2023-05-16",
          likes: 8
        }
      ];
      
      setComments(mockComments);
    } catch (err) {
      setError("Failed to extract comments. Please try again.");
      console.error(err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Facebook className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Facebook Page Scraper</h1>
        </div>
        <p className="text-muted-foreground text-center max-w-2xl">
          Extract posts and comments from Facebook pages for analysis and research purposes.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enter Facebook Page URL</CardTitle>
          <CardDescription>
            Paste the URL of the Facebook page you want to scrape
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.facebook.com/example"
              value={url}
              onChange={handleUrlChange}
              className="flex-1"
            />
            <Button onClick={extractPosts} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                "Extract Posts"
              )}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="comments" disabled={!selectedPost}>
            Comments ({comments.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts">
          {posts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Posted on {new Date(post.date).toLocaleDateString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-4 mb-2">{post.content}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{post.likes} likes</span>
                      <span>{post.comments} comments</span>
                      <span>{post.shares} shares</span>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full"
                      onClick={() => extractComments(post)}
                    >
                      Extract Comments
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p>Extracting posts...</p>
                </div>
              ) : (
                <p>Enter a Facebook page URL and click "Extract Posts" to begin</p>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="comments">
          {selectedPost && (
            <div className="mb-6">
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Selected Post</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedPost.content}</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {isLoadingComments ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Extracting comments...</p>
              </div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {comment.author}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(comment.date).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{comment.content}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <p className="text-xs text-muted-foreground">{comment.likes} likes</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : selectedPost && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No comments found for this post</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      <footer className="text-center text-sm text-muted-foreground">
        <p>
          This is a stateless application. Data is not stored or saved between sessions.
        </p>
        <p className="mt-1">
          Note: This is a demonstration with mock data. In a real implementation, you would need a backend service to handle the actual scraping.
        </p>
      </footer>
    </div>
  );
};

export default Index;
