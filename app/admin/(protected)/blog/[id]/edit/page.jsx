import BlogForm from "../../BlogForm";
import { getBlogPostById } from "@/modules/blog";
import { notFound } from "next/navigation";

export default async function EditBlogPage({ params }) {
  const { id } = await params;

  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    notFound();
  }

  const rawPost = await getBlogPostById(id);
  if (!rawPost) {
    notFound();
  }
  const post = JSON.parse(JSON.stringify(rawPost));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-text-primary">
          Edit Post: {post.title}
        </h1>
      </div>
      <BlogForm initialData={post} />
    </div>
  );
}
