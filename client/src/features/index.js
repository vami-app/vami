/**
 * Inkwell Frontend Feature Architecture (§2.2 Blueprint Specification)
 * Modular feature export barrels organized into domain boundaries.
 */

// Posts Feature Domain
export { default as PostCard } from "@/components/post/PostCard";
export { default as PostList } from "@/components/post/PostList";
export { default as RelatedPosts } from "@/components/post/RelatedPosts";
export { default as TrendingTags } from "@/components/post/TrendingTags";
export { default as ClapButton } from "@/components/post/ClapButton";
export { default as BookmarkButton } from "@/components/post/BookmarkButton";
export { default as AiAuthorshipBadge } from "@/components/post/AiAuthorshipBadge";
export { default as ForYouFeed } from "@/components/post/ForYouFeed";

// Comments Feature Domain
export { default as CommentSection } from "@/components/post/CommentSection";

// Highlights Feature Domain
export { default as HighlightLayer } from "@/components/post/HighlightLayer";
export { default as HighlightPopover } from "@/components/post/HighlightPopover";

// Membership & Monetization Feature Domain
export { default as SubscribeModal } from "@/components/membership/SubscribeModal";

// Shared Component Library (§2.2 Promotion Rule)
export { default as Navbar } from "@/components/layout/Navbar";
export { default as Footer } from "@/components/layout/Footer";
export { default as MobileDrawer } from "@/components/layout/MobileDrawer";
export { default as Avatar } from "@/components/ui/Avatar";
export { Skeleton, PostCardSkeleton, FeedSkeleton } from "@/components/ui/Skeleton";
