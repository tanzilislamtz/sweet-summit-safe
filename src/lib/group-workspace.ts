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
  privacy: "Public Group" | "Private Group";
  approveMembers: boolean;
  membersCanPost: boolean;
  membersCanCreateRooms: boolean;
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

export const listGroupPosts = (groupId: string): StoredPost[] =>
  read<PostMap>(POSTS_KEY, {})[groupId] ?? [];

export const addGroupPost = (
  groupId: string,
  input: { body: string; section: string; images: string[]; author: string },
): StoredPost => {
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
  write(POSTS_KEY, { ...map, [groupId]: [post, ...(map[groupId] ?? [])] });
  return post;
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

export const getGroupSettings = (group: StudyGroup): GroupSettings =>
  read<SettingsMap>(SETTINGS_KEY, {})[group.id] ?? {
    privacy: group.privacy,
    approveMembers: group.privacy === "Private Group",
    membersCanPost: true,
    membersCanCreateRooms: false,
  };

export const updateGroupSettings = (group: StudyGroup, patch: Partial<GroupSettings>) => {
  const map = read<SettingsMap>(SETTINGS_KEY, {});
  write(SETTINGS_KEY, { ...map, [group.id]: { ...getGroupSettings(group), ...patch } });
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
