
import { SimplifiedFacebookScraper } from "@/components/features/SimplifiedFacebookScraper";
import { Separator } from "@/components/ui/separator";
import { Facebook } from "lucide-react";

const SimplifiedIndex = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Facebook className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Facebook Page Scraper</h1>
        </div>
        <p className="text-muted-foreground text-center max-w-2xl">
          Extract posts from Facebook pages for analysis and research purposes.
        </p>
      </div>

      <SimplifiedFacebookScraper />

      <Separator className="my-8" />

      <footer className="text-center text-sm text-muted-foreground">
        <p>
          This is a stateless application. Data is not stored between sessions.
        </p>
      </footer>
    </div>
  );
};

export default SimplifiedIndex;
