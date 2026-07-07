import Sidebar from "@/components/Sidebar";
import StatusBar from "@/components/StatusBar";

// The portfolio surface: workspaces sidebar + pane area + tmux status bar.
// The thought-sandboxes surface (src/app/thoughts) brings its own chrome.
export default function MuxLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Sidebar />
      <main className="main">{children}</main>
      <StatusBar />
    </>
  );
}
