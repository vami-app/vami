import { getPublishedBlogPosts } from '@/modules/blog';
import { BlogPageFeature } from '@/features/public/blog/blog-page';

export const metadata = {
  title: 'Journal | Smalloys Technical Insights',
  description: 'Deep dives into metallurgy, copper casting, and CNC machining from the engineers at Smalloys.',
};

export default async function BlogListingPage() {
  let blogData = { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
  try {
    // Fetch initial page with limit of 12 for grid
    const result = await getPublishedBlogPosts({ limit: 12 });
    // Stringify ObjectIds for Client Components
    blogData = JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error('Database connection failed on Blog page render:', error.message);
  }

  return <BlogPageFeature blogData={blogData} />;
}
