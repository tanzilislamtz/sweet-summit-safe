import type { LucideIcon } from "lucide-react";
import {
  Users,
  Shield,
  BookOpen,
  Layers,
  HelpCircle,
  Timer,
  FileText,
  Flag,
  UsersRound,
  GraduationCap,
  ClipboardList,
  Megaphone,
  BadgeDollarSign,
  ScrollText,
  Landmark,
} from "lucide-react";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "tags"
  | "json"
  | "readonly";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  help?: string;
};

export type ColumnDef = {
  key: string;
  label: string;
  type?: "text" | "boolean" | "badge" | "date" | "number" | "tags";
  width?: string;
};

export type ResourceDef = {
  slug: string;
  table: string;
  label: string;
  description: string;
  icon: LucideIcon;
  group: "People" | "Learning" | "Community" | "Growth" | "System";
  searchColumns: string[];
  orderBy: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  filters?: { column: string; label: string; options: string[] }[];
  adminOnly?: boolean;
  canCreate?: boolean;
};

const stamp: ColumnDef = { key: "created_at", label: "Created", type: "date" };

export const RESOURCES: ResourceDef[] = [
  {
    slug: "tutors",
    table: "tutors",
    label: "Tutors",
    description: "Verified tutor directory shown on the Available Tutor page.",
    icon: GraduationCap,
    group: "People",
    searchColumns: ["name", "headline", "location"],
    orderBy: "created_at",
    columns: [
      { key: "name", label: "Name" },
      { key: "headline", label: "Headline" },
      { key: "subjects", label: "Subjects", type: "tags" },
      { key: "fee", label: "Fee", type: "number" },
      { key: "rating", label: "Rating", type: "number" },
      { key: "verified", label: "Verified", type: "boolean" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "headline", label: "Headline", type: "text" },
      { key: "subjects", label: "Subjects", type: "tags", help: "Comma separated" },
      { key: "board", label: "Board", type: "text" },
      { key: "experience", label: "Experience", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "mode", label: "Mode", type: "select", options: ["Online", "In-person", "Both"] },
      { key: "fee", label: "Monthly fee (BDT)", type: "number" },
      { key: "rating", label: "Rating", type: "number" },
      { key: "reviews", label: "Reviews", type: "number" },
      { key: "availability", label: "Availability", type: "select", options: ["today", "busy", "week"] },
      { key: "verified", label: "Verified", type: "boolean" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    filters: [
      { column: "availability", label: "Availability", options: ["today", "busy", "week"] },
      { column: "mode", label: "Mode", options: ["Online", "In-person", "Both"] },
    ],
  },
  {
    slug: "tutor-applications",
    table: "tutor_applications",
    label: "Tutor Applications",
    description: "People asking to be listed as a tutor. Approve or reject each request.",
    icon: ClipboardList,
    group: "People",
    searchColumns: ["name", "email", "phone"],
    orderBy: "created_at",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "subjects", label: "Subjects", type: "tags" },
      { key: "status", label: "Status", type: "badge" },
      stamp,
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "subjects", label: "Subjects", type: "tags" },
      { key: "message", label: "Message", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["pending", "approved", "rejected"] },
    ],
    filters: [{ column: "status", label: "Status", options: ["pending", "approved", "rejected"] }],
  },
  {
    slug: "subjects",
    table: "subjects",
    label: "Subjects",
    description: "Subjects used across Practice, Mock Test and Question Bank.",
    icon: BookOpen,
    group: "Learning",
    searchColumns: ["name", "slug"],
    orderBy: "sort_order",
    columns: [
      { key: "emoji", label: "", width: "w-10" },
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "sort_order", label: "Order", type: "number" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "name_bn", label: "Short name", type: "text" },
      { key: "emoji", label: "Emoji", type: "text" },
      { key: "color", label: "Gradient classes", type: "text", help: "e.g. from-indigo-500 to-purple-500" },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
  },
  {
    slug: "boards",
    table: "boards",
    label: "Boards",
    description: "Education boards students can filter exams by.",
    icon: Landmark,
    group: "Learning",
    searchColumns: ["name", "slug", "region"],
    orderBy: "name",
    columns: [
      { key: "name", label: "Name" },
      { key: "short", label: "Short" },
      { key: "region", label: "Region" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "short", label: "Short code", type: "text" },
      { key: "region", label: "Region", type: "text" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
  },
  {
    slug: "chapters",
    table: "chapters",
    label: "Chapters",
    description: "Chapter list per subject, used by chapter-wise practice.",
    icon: Layers,
    group: "Learning",
    searchColumns: ["name"],
    orderBy: "sort_order",
    columns: [
      { key: "name", label: "Chapter" },
      { key: "subject_id", label: "Subject" },
      { key: "sort_order", label: "Order", type: "number" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    fields: [
      { key: "name", label: "Chapter name", type: "text", required: true },
      { key: "subject_id", label: "Subject", type: "select", options: [], help: "Pick the parent subject" },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
  },
  {
    slug: "questions",
    table: "questions",
    label: "Question Bank",
    description: "MCQ, CQ and written questions with answers and explanations.",
    icon: HelpCircle,
    group: "Learning",
    searchColumns: ["prompt"],
    orderBy: "created_at",
    columns: [
      { key: "prompt", label: "Question" },
      { key: "qtype", label: "Type", type: "badge" },
      { key: "difficulty", label: "Level", type: "badge" },
      { key: "year", label: "Year", type: "number" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    fields: [
      { key: "prompt", label: "Question", type: "textarea", required: true },
      { key: "qtype", label: "Type", type: "select", options: ["mcq", "cq", "written"] },
      { key: "subject_id", label: "Subject", type: "select", options: [] },
      { key: "chapter_id", label: "Chapter", type: "select", options: [] },
      { key: "board_id", label: "Board", type: "select", options: [] },
      { key: "options", label: "Options", type: "json", help: 'JSON array, e.g. ["A","B","C","D"]' },
      { key: "correct_index", label: "Correct option index", type: "number", help: "0 = first option" },
      { key: "explanation", label: "Explanation", type: "textarea" },
      { key: "difficulty", label: "Difficulty", type: "select", options: ["easy", "medium", "hard"] },
      { key: "year", label: "Year", type: "number" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    filters: [
      { column: "qtype", label: "Type", options: ["mcq", "cq", "written"] },
      { column: "difficulty", label: "Difficulty", options: ["easy", "medium", "hard"] },
    ],
  },
  {
    slug: "mock-tests",
    table: "mock_tests",
    label: "Mock Tests",
    description: "Timed model, chapter, subject and previous-year tests.",
    icon: Timer,
    group: "Learning",
    searchColumns: ["title", "description"],
    orderBy: "created_at",
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category", type: "badge" },
      { key: "duration_minutes", label: "Minutes", type: "number" },
      { key: "total_questions", label: "Questions", type: "number" },
      { key: "is_published", label: "Published", type: "boolean" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "category", label: "Category", type: "select", options: ["model", "chapter", "subject", "previous"] },
      { key: "subject_id", label: "Subject", type: "select", options: [] },
      { key: "duration_minutes", label: "Duration (minutes)", type: "number" },
      { key: "total_questions", label: "Total questions", type: "number" },
      { key: "marks", label: "Marks", type: "number" },
      { key: "difficulty", label: "Difficulty", type: "select", options: ["easy", "medium", "hard"] },
      { key: "description", label: "Description", type: "textarea" },
      { key: "is_published", label: "Published", type: "boolean" },
    ],
    filters: [{ column: "category", label: "Category", options: ["model", "chapter", "subject", "previous"] }],
  },
  {
    slug: "posts",
    table: "posts",
    label: "Feed Posts",
    description: "Everything published to the home feed — moderate, pin or hide.",
    icon: FileText,
    group: "Community",
    searchColumns: ["title", "body", "author_name"],
    orderBy: "created_at",
    columns: [
      { key: "author_name", label: "Author" },
      { key: "kind", label: "Type", type: "badge" },
      { key: "body", label: "Content" },
      { key: "status", label: "Status", type: "badge" },
      { key: "likes", label: "Likes", type: "number" },
      { key: "pinned", label: "Pinned", type: "boolean" },
    ],
    fields: [
      { key: "author_name", label: "Author name", type: "text" },
      {
        key: "kind",
        label: "Post type",
        type: "select",
        options: ["learning", "question", "seeking-tutor", "offering-tutor", "seeking-student"],
      },
      { key: "title", label: "Title", type: "text" },
      { key: "body", label: "Body", type: "textarea", required: true },
      { key: "tag", label: "Tag", type: "text" },
      { key: "media_url", label: "Media URL", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["published", "pending", "hidden", "removed"] },
      { key: "pinned", label: "Pinned", type: "boolean" },
      { key: "likes", label: "Likes", type: "number" },
      { key: "comments_count", label: "Comments", type: "number" },
      { key: "shares", label: "Shares", type: "number" },
    ],
    filters: [
      { column: "status", label: "Status", options: ["published", "pending", "hidden", "removed"] },
      {
        column: "kind",
        label: "Type",
        options: ["learning", "question", "seeking-tutor", "offering-tutor", "seeking-student"],
      },
    ],
  },
  {
    slug: "reports",
    table: "post_reports",
    label: "Reports",
    description: "Content reported by the community. Review and resolve.",
    icon: Flag,
    group: "Community",
    searchColumns: ["reason", "details"],
    orderBy: "created_at",
    columns: [
      { key: "reason", label: "Reason" },
      { key: "details", label: "Details" },
      { key: "status", label: "Status", type: "badge" },
      stamp,
    ],
    fields: [
      { key: "reason", label: "Reason", type: "text", required: true },
      { key: "details", label: "Details", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["open", "reviewing", "resolved", "dismissed"] },
    ],
    filters: [{ column: "status", label: "Status", options: ["open", "reviewing", "resolved", "dismissed"] }],
    canCreate: false,
  },
  {
    slug: "groups",
    table: "study_groups",
    label: "Study Groups",
    description: "Community study groups, their privacy and moderation state.",
    icon: UsersRound,
    group: "Community",
    searchColumns: ["name", "tagline", "batch"],
    orderBy: "created_at",
    columns: [
      { key: "name", label: "Group" },
      { key: "batch", label: "Batch" },
      { key: "privacy", label: "Privacy", type: "badge" },
      { key: "member_count", label: "Members", type: "number" },
      { key: "status", label: "Status", type: "badge" },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text" },
      { key: "batch", label: "Batch", type: "text" },
      { key: "privacy", label: "Privacy", type: "select", options: ["public", "private"] },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "tags", label: "Tags", type: "tags" },
      { key: "member_count", label: "Member count", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["active", "pending", "archived", "blocked"] },
    ],
    filters: [{ column: "status", label: "Status", options: ["active", "pending", "archived", "blocked"] }],
  },
  {
    slug: "ads",
    table: "ads",
    label: "Sponsored Ads",
    description: "Sponsored cards shown in the feed, sidebar, quiz and groups.",
    icon: BadgeDollarSign,
    group: "Growth",
    searchColumns: ["title", "sponsor"],
    orderBy: "created_at",
    adminOnly: true,
    columns: [
      { key: "title", label: "Title" },
      { key: "sponsor", label: "Sponsor" },
      { key: "placement", label: "Placement", type: "badge" },
      { key: "impressions", label: "Views", type: "number" },
      { key: "clicks", label: "Clicks", type: "number" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "body", label: "Body", type: "textarea" },
      { key: "image_url", label: "Image URL", type: "text" },
      { key: "cta_label", label: "Button label", type: "text" },
      { key: "cta_url", label: "Button URL", type: "text" },
      { key: "sponsor", label: "Sponsor", type: "text" },
      { key: "placement", label: "Placement", type: "select", options: ["feed", "sidebar", "quiz", "group"] },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    filters: [{ column: "placement", label: "Placement", options: ["feed", "sidebar", "quiz", "group"] }],
  },
  {
    slug: "announcements",
    table: "announcements",
    label: "Announcements",
    description: "Broadcast messages to students, tutors or parents.",
    icon: Megaphone,
    group: "Growth",
    searchColumns: ["title", "body"],
    orderBy: "published_at",
    columns: [
      { key: "title", label: "Title" },
      { key: "audience", label: "Audience", type: "badge" },
      { key: "is_active", label: "Active", type: "boolean" },
      { key: "published_at", label: "Published", type: "date" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "body", label: "Message", type: "textarea", required: true },
      { key: "audience", label: "Audience", type: "select", options: ["all", "student", "tutor", "parent"] },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
  },
  {
    slug: "audit-log",
    table: "admin_audit_log",
    label: "Activity Log",
    description: "Every change made from this admin panel.",
    icon: ScrollText,
    group: "System",
    searchColumns: ["action", "entity"],
    orderBy: "created_at",
    adminOnly: true,
    canCreate: false,
    columns: [
      { key: "action", label: "Action", type: "badge" },
      { key: "entity", label: "Entity" },
      { key: "entity_id", label: "Record" },
      stamp,
    ],
    fields: [],
  },
];

export const RESOURCE_BY_SLUG = new Map(RESOURCES.map((r) => [r.slug, r]));

export const NAV_GROUPS: { group: ResourceDef["group"]; items: { slug: string; label: string; icon: LucideIcon }[] }[] =
  (["People", "Learning", "Community", "Growth", "System"] as const).map((group) => ({
    group,
    items: RESOURCES.filter((r) => r.group === group).map((r) => ({ slug: r.slug, label: r.label, icon: r.icon })),
  }));

export const STATIC_NAV = {
  users: { label: "Users & Roles", icon: Users },
  settings: { label: "Settings", icon: Shield },
};
