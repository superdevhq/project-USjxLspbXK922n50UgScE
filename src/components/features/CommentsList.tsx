
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  likes: number;
}

interface Post {
  id: string;
  content: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
}

interface CommentsListProps {
  selectedPost: Post | null;
  comments: Comment[];
  isLoading: boolean;
}

export const CommentsList = ({ selectedPost, comments, isLoading }: CommentsListProps) => {
  return (
    <div>
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
      
      {isLoading ? (
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
    </div>
  );
};
