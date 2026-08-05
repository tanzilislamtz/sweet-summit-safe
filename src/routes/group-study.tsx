import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Topbar } from "@/components/Topbar";
import { MobileNav } from "@/components/MobileNav";
import { LeftNav } from "@/components/LeftNav";

export const Route = createFileRoute("/group-study")({
  head: () => ({
    meta: [
      { title: "Group Study — Learns Academy" },
      {
        name: "description",
        content:
          "Create or join study groups, share notes, run live study rooms and prepare together with your batch.",
      },
      { property: "og:title", content: "Group Study — Learns Academy" },
      {
        property: "og:description",
        content: "Study groups with sections, live rooms, shared files and events.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroupStudyLayout,
});

function GroupStudyLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground lg:h-[100dvh] lg:overflow-hidden">
      <Topbar variant="app" onMenu={() => setMenuOpen(true)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 lg:h-[calc(100dvh-65px)] lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden lg:px-8">
        <LeftNav stickyClass="lg:h-full" />
        <div className="min-w-0 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
