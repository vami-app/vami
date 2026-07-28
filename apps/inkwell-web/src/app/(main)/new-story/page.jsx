"use client";

import RequireAuth from "@/components/layout/RequireAuth";
import StoryComposer from "@/components/editor/StoryComposer";

export default function NewStoryPage() {
  return (
    <RequireAuth>
      <StoryComposer mode="create" />
    </RequireAuth>
  );
}
