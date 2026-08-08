import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { z } from 'zod';

type Review = {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  userFirstName: string | null;
  userLastName: string | null;
};

type ProductReviewsProps = {
  productId: string;
  productName: string;
  currentUserId?: string | null;
};

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be at most 1000 characters'),
});

function StarRating({ 
  rating, 
  interactive = false, 
  size = 'md',
  onRatingChange 
}: { 
  rating: number; 
  interactive?: boolean; 
  size?: 'sm' | 'md' | 'lg';
  onRatingChange?: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = interactive 
          ? star <= (hoverRating || rating)
          : star <= rating;
        
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRatingChange?.(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            data-testid={`star-${star}`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                filled 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-none text-gray-600'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const reviewDate = new Date(review.createdAt).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const userName = review.userFirstName && review.userLastName
    ? `${review.userFirstName} ${review.userLastName}`
    : review.userFirstName || 'Anonymous';
  
  return (
    <div className="border-b border-gray-700 pb-6 last:border-0" data-testid={`review-${review.id}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={review.rating} size="sm" />
            {review.isVerifiedPurchase && (
              <div className="flex items-center gap-1 text-green-400 text-xs">
                <CheckCircle className="h-3 w-3" />
                <span data-testid="text-verified-purchase">Verified Purchase</span>
              </div>
            )}
          </div>
          <p className="font-medium text-white" data-testid="text-reviewer-name">
            {userName}
          </p>
        </div>
        <p className="text-sm text-gray-400" data-testid="text-review-date">{reviewDate}</p>
      </div>
      <p className="text-gray-400 leading-relaxed" data-testid="text-review-comment">
        {review.comment}
      </p>
    </div>
  );
}

function ReviewForm({ 
  productId, 
  productName,
  onSuccess 
}: { 
  productId: string;
  productName: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});
  
  const submitReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      return await apiRequest('POST', `/api/products/${productId}/reviews`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
      setRating(0);
      setComment('');
      setErrors({});
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      onSuccess();
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to submit review";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = reviewSchema.safeParse({ rating, comment });
    
    if (!result.success) {
      const fieldErrors: { rating?: string; comment?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'rating') {
          fieldErrors.rating = err.message;
        } else if (err.path[0] === 'comment') {
          fieldErrors.comment = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    if (rating === 0) {
      setErrors({ rating: 'Please select a rating' });
      return;
    }
    
    submitReviewMutation.mutate({ rating, comment });
  };
  
  return (
    <div className="bg-gray-900 p-6 rounded-md border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Rating *
          </label>
          <StarRating 
            rating={rating} 
            interactive 
            size="lg"
            onRatingChange={setRating}
          />
          {errors.rating && (
            <p className="text-destructive text-sm mt-1" data-testid="error-rating">
              {errors.rating}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Your Review *
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Share your experience with ${productName}...`}
            rows={4}
            className="resize-none bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
            data-testid="input-review-comment"
          />
          {errors.comment && (
            <p className="text-destructive text-sm mt-1" data-testid="error-comment">
              {errors.comment}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {comment.length}/1000 characters (minimum 10)
          </p>
        </div>
        
        <Button
          type="submit"
          disabled={submitReviewMutation.isPending}
          className="w-full bg-white text-black hover:bg-gray-200"
          data-testid="button-submit-review"
        >
          {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    </div>
  );
}

export default function ProductReviews({ 
  productId, 
  productName,
  currentUserId 
}: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: [`/api/products/${productId}/reviews`],
  });
  
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  
  const userReview = reviews.find(r => r.userId === currentUserId);
  
  if (isLoading) {
    return (
      <div className="mt-12 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/4 mb-4"></div>
        <div className="h-24 bg-gray-800 rounded"></div>
      </div>
    );
  }
  
  return (
    <div className="mt-12 border-t border-gray-700 pt-12" data-testid="section-product-reviews">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Customer Reviews</h2>
        
        {reviews.length > 0 ? (
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(averageRating)} size="md" />
              <span className="text-lg font-semibold text-white" data-testid="text-average-rating">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-400" data-testid="text-review-count">
              Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        ) : (
          <p className="text-gray-400 mb-6">No reviews yet. Be the first to review this product!</p>
        )}
        
        {currentUserId && (
          <div className="mb-8">
            {!showForm && !userReview && (
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
                data-testid="button-write-review"
              >
                Write a Review
              </Button>
            )}
            
            {showForm && (
              <ReviewForm 
                productId={productId} 
                productName={productName}
                onSuccess={() => setShowForm(false)}
              />
            )}
            
            {userReview && (
              <div className="bg-primary/10 border border-primary/30 p-4 rounded-md">
                <p className="text-sm text-primary">
                  You have already reviewed this product. 
                  <button
                    onClick={() => setShowForm(true)}
                    className="ml-2 underline hover:no-underline"
                    data-testid="button-edit-review"
                  >
                    Edit your review
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
        
        {!currentUserId && (
          <div className="bg-gray-900 border border-gray-700 p-4 rounded-md mb-8">
            <p className="text-sm text-gray-400">
              Please log in to write a review.
            </p>
          </div>
        )}
      </div>
      
      {reviews.length > 0 && (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
