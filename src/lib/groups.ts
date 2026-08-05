/** Local persistence for user-created groups and join state. */
import type { StudyGroup } from "@/data/groups";
import { studyGroups } from "@/data/groups";

export const GROUPS_EVENT = "la:groups";

const CREATED_KEY = "la:groups:created";
const JOINED_KEY = "la:groups:joined";

export type CreatedGroup = {
  id: string;
  name: string;
  batch: string;
  privacy: "Public Group" | "Private Group";
  tagline: string;
  tags: string[];
  createdAt: number;
};

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
    /* storage unavailable — ignore */
  }
};

export const listCreatedGroups = (): CreatedGroup[] => read<CreatedGroup[]>(CREATED_KEY, []);

export const createGroup = (input: Omit<CreatedGroup, "id" | "createdAt">): CreatedGroup => {
  const id =
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `group-${Date.now()}`;
  const group: CreatedGroup = { ...input, id, createdAt: Date.now() };
  write(CREATED_KEY, [group, ...listCreatedGroups().filter((g) => g.id !== id)]);
  setJoined(id, true);
  return group;
};

export const listJoinedIds = (): string[] => read<string[]>(JOINED_KEY, []);

export const setJoined = (id: string, joined: boolean) => {
  const current = listJoinedIds().filter((g) => g !== id);
  write(JOINED_KEY, joined ? [id, ...current] : current);
};

export const isJoined = (group: Pick<StudyGroup, "id" | "joined">): boolean =>
  listJoinedIds().includes(group.id) || group.joined;

/** Turns a locally created group into a full group shape reusing demo content. */
export const hydrateCreatedGroup = (created: CreatedGroup): StudyGroup => {
  const base = studyGroups[0]!;
  return {
    ...base,
    id: created.id,
    name: created.name,
    batch: created.batch,
    privacy: created.privacy,
    tagline: created.tagline,
    description: created.tagline,
    tags: created.tags,
    createdOn: new Date(created.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    createdBy: "You",
    members: 1,
    onlineNow: 1,
    rooms: 0,
    files: 0,
    joined: true,
    memberList: [],
    roomList: [],
    fileList: [],
    eventList: [],
    postList: [],
  };
};

export const findGroup = (id: string): StudyGroup | undefined => {
  const demo = studyGroups.find((g) => g.id === id);
  if (demo) return demo;
  const created = listCreatedGroups().find((g) => g.id === id);
  return created ? hydrateCreatedGroup(created) : undefined;
};
