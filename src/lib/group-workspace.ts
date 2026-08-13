/**
 * Local (demo-only) workspace state for a study group:
 * posts written by the user, member role overrides, removals,
 * pending join requests and group settings.
 *
 * Everything is stored in localStorage so the UI feels real without a backend.
 */
import type { GroupMember, GroupPost, StudyGroup } from "@/data/groups";
import { GROUPS_EVENT, listCreatedGroups } from "@/lib/groups";

export type GroupRole = GroupMember["role"];

export type GroupSettings = {
  /** identity */
  name: string;
  tagline: string;
  description: string;
  batch: string;
  board: string;
  classLevel: string;
  language: string;
  icon?: string;
  cover?: string;
  /** how the signed-in admin is shown inside this group */
  displayName: string;
  rules: string[];
  /** privacy and permissions */
  privacy: "Public Group" | "Private Group";
  approveMembers: boolean;
  membersCanPost: boolean;
  membersCanCreateRooms: boolean;
  membersCanInvite: boolean;
  membersCanUpload: boolean;
  postsNeedApproval: boolean;
  autoApproveQuestions: boolean;
  requireMemberApproval: boolean;
  pendingPostIds: string[];
};

export type JoinRequest = {
  id: string;
  name: string;
  initials: string;
  section: string;
  requestedOn: string;
};

const POSTS_KEY = "la:groups:posts";
const ROLES_KEY = "la:groups:roles";
const REMOVED_KEY = "la:groups:removed";
const SETTINGS_KEY = "la:groups:settings";
const REQUESTS_KEY = "la:groups:requests";

const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(GROUPS_EVENT));
  } catch {
    /* storage full or unavailable — keep the UI working */
  }
};

/* ----------------------------- posts ----------------------------- */

export type StoredPost = GroupPost & { images?: string[]; createdAt: number };

type PostMap = Record<string, StoredPost[]>;

export const listGroupPosts = (groupId: string): StoredPost[] => {
  const all = read<PostMap>(POSTS_KEY, {})[groupId] ?? [];
  const settings = read<SettingsMap>(SETTINGS_KEY, {})[groupId];
  const pending = settings?.pendingPostIds || [];
  return all.filter(p => !pending.includes(p.id));
};

export const addGroupPost = (
  groupId: string,
  input: { body: string; section: string; images: string[]; author: string },
): StoredPost => {
  const settings = read<SettingsMap>(SETTINGS_KEY, {})[groupId];
  const isQuestion = input.body.includes("$");
  const needsApproval =
    settings?.postsNeedApproval &&
    !(settings?.autoApproveQuestions && isQuestion);

  const post: StoredPost = {
    id: `p-${Date.now()}`,
    author: input.author,
    initials: input.author.charAt(0).toUpperCase(),
    section: input.section,
    time: "Just now",
    body: input.body,
    likes: 0,
    comments: 0,
    images: input.images,
    createdAt: Date.now(),
  };
  const map = read<PostMap>(POSTS_KEY, {});
  
  if (needsApproval) {
    const sMap = read<SettingsMap>(SETTINGS_KEY, {});
    const s = sMap[groupId] || defaultGroupSettings({ id: groupId } as any);
    s.pendingPostIds = [post.id, ...(s.pendingPostIds || [])];
    write(SETTINGS_KEY, { ...sMap, [groupId]: s });
  }

  write(POSTS_KEY, { ...map, [groupId]: [post, ...(map[groupId] ?? [])] });
  return post;
};

/* ----------------------------- rooms ----------------------------- */

const ROOMS_KEY = "la:groups:rooms";
const ROOM_JOINS_KEY = "la:groups:room-joins";

type RoomMap = Record<string, GroupRoom[]>;
type RoomJoinMap = Record<string, string[]>; // groupId::roomId -> [userIds]

export const listGroupRooms = (groupId: string): GroupRoom[] => {
  return read<RoomMap>(ROOMS_KEY, {})[groupId] ?? [];
};

export const addGroupRoom = (
  groupId: string,
  input: { 
    title: string; 
    focus: string; 
    section: string; 
    host: string; 
    limit?: number; 
    privacy: "Public" | "Private" 
  },
): GroupRoom => {
  const room: GroupRoom = {
    id: `r-${Date.now()}`,
    title: input.title,
    focus: input.focus,
    section: input.section,
    host: input.host,
    participants: 1, // host joins by default
    limit: input.limit,
    privacy: input.privacy,
    inviteCode: input.privacy === "Private" ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined,
    live: true,
    when: "Live now",
  };
  const map = read<RoomMap>(ROOMS_KEY, {});
  write(ROOMS_KEY, { ...map, [groupId]: [room, ...(map[groupId] ?? [])] });
  
  // Also track the host as a joined participant
  const joins = read<RoomJoinMap>(ROOM_JOINS_KEY, {});
  const joinKey = `${groupId}::${room.id}`;
  write(ROOM_JOINS_KEY, { ...joins, [joinKey]: ["me"] }); // 'me' is session placeholder
  
  return room;
};

export const joinRoom = (groupId: string, roomId: string): boolean => {
  const joinKey = `${groupId}::${roomId}`;
  const map = read<RoomJoinMap>(ROOM_JOINS_KEY, {});
  const current = map[joinKey] ?? [];
  if (current.includes("me")) return true;
  
  const next = ["me", ...current];
  write(ROOM_JOINS_KEY, { ...map, [joinKey]: next });
  return true;
};

export const isRoomJoined = (groupId: string, roomId: string): boolean => {
  const joinKey = `${groupId}::${roomId}`;
  return (read<RoomJoinMap>(ROOM_JOINS_KEY, {})[joinKey] ?? []).includes("me");
};

/* ------------- reactions, comments, hidden posts ------------------ */

const LOVES_KEY = "la:groups:post-loves";
const COMMENTS_KEY = "la:groups:post-comments";
const HIDDEN_KEY = "la:groups:post-hidden";

export type GroupPostComment = {
  id: string;
  author: string;
  text: string;
  time: string;
};

type LoveMap = Record<string, string[]>;
type CommentMap = Record<string, GroupPostComment[]>;
type HiddenMap = Record<string, string[]>;

const scope = (groupId: string, postId: string) => `${groupId}::${postId}`;

/** Has the signed-in user loved this post? */
export const isPostLoved = (groupId: string, postId: string): boolean =>
  (read<LoveMap>(LOVES_KEY, {})[groupId] ?? []).includes(postId);

export const togglePostLove = (groupId: string, postId: string): boolean => {
  const map = read<LoveMap>(LOVES_KEY, {});
  const current = map[groupId] ?? [];
  const loved = current.includes(postId);
  const next = loved ? current.filter((id) => id !== postId) : [postId, ...current];
  write(LOVES_KEY, { ...map, [groupId]: next });
  return !loved;
};

export const listPostComments = (groupId: string, postId: string): GroupPostComment[] =>
  read<CommentMap>(COMMENTS_KEY, {})[scope(groupId, postId)] ?? [];

export const addPostComment = (
  groupId: string,
  postId: string,
  input: { author: string; text: string },
): GroupPostComment => {
  const comment: GroupPostComment = {
    id: `c-${Date.now()}`,
    author: input.author,
    text: input.text,
    time: "Just now",
  };
  const key = scope(groupId, postId);
  const map = read<CommentMap>(COMMENTS_KEY, {});
  write(COMMENTS_KEY, { ...map, [key]: [...(map[key] ?? []), comment] });
  return comment;
};

export const listHiddenPosts = (groupId: string): string[] =>
  read<HiddenMap>(HIDDEN_KEY, {})[groupId] ?? [];

export const hideGroupPost = (groupId: string, postId: string) => {
  const map = read<HiddenMap>(HIDDEN_KEY, {});
  const current = (map[groupId] ?? []).filter((id) => id !== postId);
  write(HIDDEN_KEY, { ...map, [groupId]: [postId, ...current] });
};

export const unhideGroupPost = (groupId: string, postId: string) => {
  const map = read<HiddenMap>(HIDDEN_KEY, {});
  write(HIDDEN_KEY, { ...map, [groupId]: (map[groupId] ?? []).filter((id) => id !== postId) });
};

export const deleteGroupPost = (groupId: string, postId: string) => {
  const map = read<PostMap>(POSTS_KEY, {});
  write(POSTS_KEY, { ...map, [groupId]: (map[groupId] ?? []).filter((p) => p.id !== postId) });
};

/* ----------------------- members and roles ------------------------ */

type RoleMap = Record<string, Record<string, GroupRole>>;
type RemovedMap = Record<string, string[]>;

export const getMemberRole = (groupId: string, member: GroupMember): GroupRole =>
  read<RoleMap>(ROLES_KEY, {})[groupId]?.[member.id] ?? member.role;

export const setMemberRole = (groupId: string, memberId: string, role: GroupRole) => {
  const map = read<RoleMap>(ROLES_KEY, {});
  write(ROLES_KEY, { ...map, [groupId]: { ...(map[groupId] ?? {}), [memberId]: role } });
};

export const listRemovedMembers = (groupId: string): string[] =>
  read<RemovedMap>(REMOVED_KEY, {})[groupId] ?? [];

export const setMemberRemoved = (groupId: string, memberId: string, removed: boolean) => {
  const map = read<RemovedMap>(REMOVED_KEY, {});
  const current = (map[groupId] ?? []).filter((id) => id !== memberId);
  write(REMOVED_KEY, { ...map, [groupId]: removed ? [memberId, ...current] : current });
};

/** Members with role overrides applied and removed members filtered out. */
export const resolveMembers = (group: StudyGroup): GroupMember[] => {
  const removed = listRemovedMembers(group.id);
  return group.memberList
    .filter((m) => !removed.includes(m.id))
    .map((m) => ({ ...m, role: getMemberRole(group.id, m) }));
};

/* --------------------------- settings ----------------------------- */

type SettingsMap = Record<string, GroupSettings>;

/** Fallback board/class derived from the group's batch label, e.g. "SSC · 2026 Batch". */
const deriveClass = (batch: string) => batch.split("·")[0]?.trim() || "SSC";

export const defaultGroupSettings = (group: StudyGroup): GroupSettings => ({
  name: group.name,
  tagline: group.tagline,
  description: group.description,
  batch: group.batch,
  board: "Dhaka Board",
  classLevel: deriveClass(group.batch),
  language: group.language,
  displayName: "You",
  rules: group.rules,
  privacy: group.privacy,
  approveMembers: group.privacy === "Private Group",
  membersCanPost: true,
  membersCanCreateRooms: false,
  membersCanInvite: true,
  membersCanUpload: true,
  postsNeedApproval: false,
  autoApproveQuestions: true,
  requireMemberApproval: group.privacy === "Private Group",
  pendingPostIds: [],
});

export const getGroupSettings = (group: StudyGroup): GroupSettings => ({
  ...defaultGroupSettings(group),
  ...(read<SettingsMap>(SETTINGS_KEY, {})[group.id] ?? {}),
});

export const updateGroupSettings = (group: StudyGroup, patch: Partial<GroupSettings>) => {
  const map = read<SettingsMap>(SETTINGS_KEY, {});
  write(SETTINGS_KEY, { ...map, [group.id]: { ...getGroupSettings(group), ...patch } });
};

/** Group with admin-saved overrides applied — use this everywhere the group is rendered. */
export const applyGroupOverrides = (group: StudyGroup): StudyGroup => {
  const s = getGroupSettings(group);
  return {
    ...group,
    name: s.name,
    tagline: s.tagline,
    description: s.description,
    batch: s.batch,
    language: s.language,
    privacy: s.privacy,
    rules: s.rules,
    icon: s.icon,
    cover: s.cover,
  };
};

/* ------------------------ join requests --------------------------- */

const DEFAULT_REQUESTS: JoinRequest[] = [
  { id: "jr1", name: "Tanvir Hasan", initials: "TH", section: "Science", requestedOn: "Today" },
  { id: "jr2", name: "Sadia Afrin", initials: "SA", section: "Commerce", requestedOn: "Today" },
  { id: "jr3", name: "Rafid Chowdhury", initials: "RC", section: "Humanities", requestedOn: "Yesterday" },
];

type RequestMap = Record<string, JoinRequest[]>;

export const listJoinRequests = (groupId: string): JoinRequest[] => {
  const map = read<RequestMap>(REQUESTS_KEY, {});
  return map[groupId] ?? DEFAULT_REQUESTS;
};

export const resolveJoinRequest = (groupId: string, requestId: string) => {
  const map = read<RequestMap>(REQUESTS_KEY, {});
  write(REQUESTS_KEY, {
    ...map,
    [groupId]: listJoinRequests(groupId).filter((r) => r.id !== requestId),
  });
};

/* ---------------------------- ownership --------------------------- */

/** The signed-in user owns groups they created locally. */
export const isGroupOwner = (groupId: string): boolean =>
  listCreatedGroups().some((g) => g.id === groupId);

/** Admin rights: owner, or an admin of a demo group the user has joined. */
export const canManageGroup = (group: StudyGroup, joined: boolean): boolean =>
  isGroupOwner(group.id) || joined;
