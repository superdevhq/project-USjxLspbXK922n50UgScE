
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, Facebook, Download, Lock } from "lucide-react";
import { 
  extractPostsFromPage, 
  extractCommentsFromPost, 
  isValidFacebookUrl,
  exportAsJson,
  exportAsCsv,
  downloadAsFile,
  Post,
  Comment
} from "@/lib/facebook-scraper";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [useCredentials, setUseCredentials] = useState<boolean>(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string }>({
    email: "",
    password: ""
  });

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  };

  const handleCredentialChange = (field: 'email' | 'password', value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const extractPosts = async () => {
    if (!url) {
      setError("Please enter a Facebook page URL");
      return;
    }

    if (!isValidFacebookUrl(url)) {
      setError("Please enter a valid Facebook page URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPosts([]);
    setSelectedPost(null);
    setComments([]);

    try {
      const scraperOptions = {
        url,
        limit: 10,
        credentials: useCredentials ? credentials : undefined
      };
      
      const extractedPosts = await extractPostsFromPage(scraperOptions);
      setPosts(extractedPosts);
      
      toast({
        title: "Posts extracted successfully",
        description: `Found ${extractedPosts.length} posts from the page.`,
      });
    } catch (err: any) {
      setError(`Failed to extract posts: ${err.message}`);
      console.error(err);
      
      toast({
        variant: "destructive",
        title: "Error extracting posts",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractComments = async (post: Post) => {
    setSelectedPost(post);
    setIsLoadingComments(true);
    setComments([]);

    try {
      const scraperOptions = {
        url: post.postUrl || url,
        postId: post.id,
        limit: 20,
        credentials: useCredentials ? credentials : undefined
      };
      
      const extractedComments = await extractCommentsFromPost(scraperOptions);
      setComments(extractedComments);
      
      toast({
        title: "Comments extracted successfully",
        description: `Found ${extractedComments.length} comments on this post.`,
      });
    } catch (err: any) {
      setError(`Failed to extract comments: ${err.message}`);
      console.error(err);
      
      toast({
        variant: "destructive",
        title: "Error extracting comments",
        description: err.message,
      });
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleExportData = (type: 'json' | 'csv', dataType: 'posts' | 'comments') => {
    const data = dataType === 'posts' ? posts : comments;
    const filename = `facebook_${dataType}_${new Date().toISOString().split('T')[0]}`;
    
    if (type === 'json') {
      const jsonData = exportAsJson(data);
      downloadAsFile(jsonData, `${filename}.json`, 'json');
    } else {
      const csvData = exportAsCsv(data);
      downloadAsFile(csvData, `${filename}.csv`, 'csv');
    }
    
    toast({
      title: "Export successful",
      description: `${dataType} exported as ${type.toUpperCase()} file.`,
    });
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
          <div className="flex gap-2 mb-4">
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
          
          <div className="flex items-center space-x-2 mb-4">
            <Switch 
              id="use-credentials" 
              checked={useCredentials}
              onCheckedChange={setUseCredentials}
            />
            <Label htmlFor="use-credentials" className="cursor-pointer">Use Facebook credentials for better results</Label>
            
            {useCredentials && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Lock className="h-4 w-4 mr-2" />
                    Configure Credentials
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Facebook Credentials</DialogTitle>
                    <DialogDescription>
                      Enter your Facebook login details to improve scraping reliability.
                      Credentials are used only for the current session and are not stored.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={credentials.email}
                        onChange={(e) => handleCredentialChange('email', e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={credentials.password}
                        onChange={(e) => handleCredentialChange('password', e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {error && (
            <Alert variant="destructive">
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
          {posts.length > 0 && (
            <div className="flex justify-end mb-4 gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportData('json', 'posts')}>
                <Download className="mr-2 h-4 w-4" />
                Export as JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportData('csv', 'posts')}>
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
            </div>
          )}
          
          {posts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Posted on {post.date}
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
          
          {comments.length > 0 && (
            <div className="flex justify-end mb-4 gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportData('json', 'comments')}>
                <Download className="mr-2 h-4 w-4" />
                Export as JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportData('csv', 'comments')}>
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
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
                      {comment.date}
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
          This is a stateless application. Data is not stored between sessions.
        </p>
        <p className="mt-1">
          For more reliable scraping, use Facebook credentials (they are used only for the current session).
        </p>
      </footer>
    </div>
  );
};

export default Index;
