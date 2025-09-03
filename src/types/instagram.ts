export interface CommentData {
  username: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  likes?: number;
  timestamp?: string;
}

export interface PostData {
  id: string;
  url: string;
  date: string;
  type: 'image' | 'carousel' | 'video';
  caption: string;
  likes: number;
  comments: CommentData[];
  engagement: number;
  hashtags: string[];
  mentions: string[];
  mediaUrls?: string[];
}

export interface InstagramAnalysisData {
  username: string;
  analysisDate: string;
  period: string;
  totalPosts: number;
  posts: PostData[];
  summary: {
    totalLikes: number;
    totalComments: number;
    averageEngagement: number;
    mostEngagedPost?: PostData;
    contentTypeBreakdown: {
      images: number;
      carousels: number;
      videos: number;
    };
    sentimentBreakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
}

export interface ScrapingOptions {
  daysBack?: number;
  maxPosts?: number;
  maxCommentsPerPost?: number;
  includeMediaUrls?: boolean;
  rateLimitMs?: number;
}
