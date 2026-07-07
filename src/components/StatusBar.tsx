import { getContentMeta } from "@/lib/content";
import { Toast, WindowList } from "./WindowList";

export default function StatusBar() {
  const { sha } = getContentMeta();
  return (
    <footer className="status">
      <span className="lft">
        <WindowList />
        <Toast />
      </span>
      <span className="rgt">
        <button data-keys-open>? keys</button>
        <span className="divider hidesm">│</span>
        <span className="hidesm" title="content repo commit this build rendered">
          content@{sha}
        </span>
        <span className="divider hidesm">│</span>
        <span className="hidesm">princeton, nj</span>
      </span>
    </footer>
  );
}
