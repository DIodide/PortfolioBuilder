import StatusBar from "@/components/StatusBar";
import { ThoughtsProvider } from "@/components/ThoughtsProvider";
import ThoughtsSidebar, { type SidebarPost } from "@/components/ThoughtsSidebar";
import { getContentMeta, getPosts, getThoughtsMeta } from "@/lib/content";
import "./thoughts.css";

// The thought-sandboxes surface: same chassis as the mux (sidebar + main +
// status bar in the root grid), different light. getPosts() already scopes
// this build — drafts exist here only when SHOW_DRAFTS=1.
export default function ThoughtsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const posts = getPosts();
  const { published, drafts } = getThoughtsMeta();
  const { thoughtsSha } = getContentMeta();

  const sidebarPosts: SidebarPost[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    hide: p.hide,
    tag: p.tags[0] ?? null,
  }));
  const tags = [...new Set(posts.flatMap((p) => p.tags))];

  return (
    <ThoughtsProvider>
      <ThoughtsSidebar
        posts={sidebarPosts}
        tags={tags}
        published={published}
        drafts={drafts}
        draftsVisible={process.env.SHOW_DRAFTS === "1"}
        thoughtsSha={thoughtsSha}
      />
      <main className="main" data-acc="thoughts">
        {children}
      </main>
      <StatusBar />
    </ThoughtsProvider>
  );
}
