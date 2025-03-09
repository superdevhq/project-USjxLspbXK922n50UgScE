
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Download } from "lucide-react";

interface ScraperProps {
  onPostsExtracted: (posts: any[]) => void;
  isLoading: boolean;
}

export const FacebookScraper = ({ onPostsExtracted, isLoading }: ScraperProps) => {
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

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

    try {
      // This is a mock implementation
      // In a real implementation, this would call your backend service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data for demonstration
      const mockPosts = [
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
      
      onPostsExtracted(mockPosts);
    } catch (err) {
      setError("Failed to extract posts. Please try again.");
      console.error(err);
    }
  };

  const handleExportData = () => {
    // This would be implemented to export the data as CSV or JSON
    alert("Export functionality will be implemented here");
  };

  return (
    <Card>
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
      <CardFooter className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </CardFooter>
    </Card>
  );
};
