
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Post {
  id: string;
  content: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
}

interface PostsListProps {
  posts: Post[];
  isLoading: boolean;
  onSelectPost: (post: Post) => void;
}

export const PostsList = ({ posts, isLoading, onSelectPost }: PostsListProps) => {
  return (
    <div>
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
                  onClick={() => onSelectPost(post)}
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
    </div>
  );
};
