import { cache } from 'react';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import BlogPost from '@/models/BlogPost';
import Category from '@/models/Category';

export const getDashboardStats = cache(async () => {
  await dbConnect();
  
  const productCount = await Product.countDocuments();
  const blogCount = await BlogPost.countDocuments();
  const categoryCount = await Category.countDocuments();

  return { productCount, blogCount, categoryCount };
});
