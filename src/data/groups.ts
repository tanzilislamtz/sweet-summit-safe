export type GroupSection = {
  id: string;
  name: string;
  tagline: string;
  members: number;
  subjects: string[];
  rooms: number;
  files: number;
};

export type GroupMember = {
  id: string;
  name: string;
  initials: string;
  standard: string;
  section: string;
  role: "Admin" | "Moderator" | "Tutor" | "Student";
  expertise: string;
  joined: string;
  status: "Online" | "Away" | "Offline";
};

export type GroupRoom = {
  id: string;
  title: string;
  focus: string;
  section: string;
  host: string;
  participants: number;
  limit?: number;
  privacy?: "Public" | "Private";
  inviteCode?: string;
  live: boolean;
  when: string;
};

export type GroupFile = {
  id: string;
  name: string;
  section: string;
  uploadedBy: string;
  role: string;
  size: string;
  uploadedOn: string;
  downloads: number;
};

export type GroupEvent = {
  id: string;
  title: string;
  date: string;
  day: string;
  time: string;
  section: string;
  host: string;
  going: number;
  mode: "Online" | "Live Session" | "Upcoming";
};

export type GroupPost = {
  id: string;
  author: string;
  initials: string;
  section: string;
  time: string;
  body: string;
  likes: number;
  comments: number;
  attachment?: { name: string; meta: string };
};

export type StudyGroup = {
  id: string;
  name: string;
  batch: string;
  privacy: "Public Group" | "Private Group";
  tagline: string;
  description: string;
  tags: string[];
  createdOn: string;
  createdBy: string;
  language: string;
  members: number;
  onlineNow: number;
  rooms: number;
  files: number;
  joined: boolean;
  sections: GroupSection[];
  memberList: GroupMember[];
  roomList: GroupRoom[];
  fileList: GroupFile[];
  eventList: GroupEvent[];
  postList: GroupPost[];
  rules: string[];
  icon?: string;
  cover?: string;
};

const sections: GroupSection[] = [
  {
    id: "science",
    name: "Science",
    tagline: "Concepts. Practice. Discover.",
    members: 92,
    subjects: ["Physics", "Chemistry", "Biology", "Higher Math"],
    rooms: 18,
    files: 128,
  },
  {
    id: "commerce",
    name: "Commerce",
    tagline: "Understand. Analyze. Succeed.",
    members: 86,
    subjects: ["Accounting", "Finance", "Business", "Entrepreneurship"],
    rooms: 16,
    files: 104,
  },
  {
    id: "humanities",
    name: "Humanities",
    tagline: "Explore. Understand. Connect.",
    members: 70,
    subjects: ["History", "Civics", "Geography", "Economics"],
    rooms: 14,
    files: 96,
  },
];

const memberList: GroupMember[] = [
  { id: "m1", name: "Aarav Mehta", initials: "AM", standard: "12th Standard", section: "Science", role: "Admin", expertise: "Physics, Mathematics", joined: "May 1, 2024", status: "Online" },
  { id: "m2", name: "Neha Patel", initials: "NP", standard: "12th Standard", section: "Science", role: "Tutor", expertise: "Physics, Mathematics", joined: "Apr 28, 2024", status: "Online" },
  { id: "m3", name: "Arjun Verma", initials: "AV", standard: "12th Standard", section: "Commerce", role: "Moderator", expertise: "Accountancy, Economics", joined: "Apr 30, 2024", status: "Away" },
  { id: "m4", name: "Riya Sharma", initials: "RS", standard: "12th Standard", section: "Humanities", role: "Student", expertise: "History, Political Science", joined: "May 2, 2024", status: "Offline" },
  { id: "m5", name: "Aditya Singh", initials: "AS", standard: "12th Standard", section: "Science", role: "Student", expertise: "Chemistry, Biology", joined: "May 4, 2024", status: "Online" },
  { id: "m6", name: "Pooja Iyer", initials: "PI", standard: "12th Standard", section: "Commerce", role: "Student", expertise: "Business Studies, Maths", joined: "May 3, 2024", status: "Away" },
  { id: "m7", name: "Kabir Khan", initials: "KK", standard: "12th Standard", section: "Humanities", role: "Student", expertise: "Geography, History", joined: "May 5, 2024", status: "Offline" },
  { id: "m8", name: "Meera Joshi", initials: "MJ", standard: "12th Standard", section: "Science", role: "Tutor", expertise: "Chemistry, Biology", joined: "May 6, 2024", status: "Online" },
];

const roomList: GroupRoom[] = [
  { id: "r1", title: "Physics Doubt Room", focus: "Kinematics and Newton's laws", section: "Science", host: "Neha Patel", participants: 52, live: true, when: "Live now" },
  { id: "r2", title: "Accounting Practice Room", focus: "Journal entries drill", section: "Commerce", host: "Arjun Verma", participants: 38, live: true, when: "Live now" },
  { id: "r3", title: "English Grammar Room", focus: "Tense and narration", section: "Common", host: "Riya Sharma", participants: 44, live: true, when: "Live now" },
  { id: "r4", title: "History Revision Room", focus: "Revolt of 1857", section: "Humanities", host: "Aditya Singh", participants: 29, live: true, when: "Live now" },
  { id: "r5", title: "Maths Problem Solving Session", focus: "Algebra and geometry", section: "Common", host: "Aarav Mehta", participants: 62, live: false, when: "Today · 7:00 PM" },
  { id: "r6", title: "Chemistry Organic Basics", focus: "Reactions and mechanisms", section: "Science", host: "Neha Patel", participants: 48, live: false, when: "Today · 8:30 PM" },
  { id: "r7", title: "Business Studies Case Discussion", focus: "Case studies and real examples", section: "Commerce", host: "Arjun Verma", participants: 41, live: false, when: "Tomorrow · 6:30 PM" },
  { id: "r8", title: "Polity Important Concepts", focus: "Key articles and amendments", section: "Humanities", host: "Aditya Singh", participants: 37, live: false, when: "Tomorrow · 8:00 PM" },
];

const fileList: GroupFile[] = [
  { id: "f1", name: "SSC Routine.pdf", section: "Common", uploadedBy: "Aarav Mehta", role: "Admin", size: "1.2 MB", uploadedOn: "May 6, 2024", downloads: 342 },
  { id: "f2", name: "Physics Important Formulas.pdf", section: "Science", uploadedBy: "Neha Patel", role: "Tutor", size: "2.4 MB", uploadedOn: "May 5, 2024", downloads: 512 },
  { id: "f3", name: "Chemistry Suggestion 2026.pdf", section: "Science", uploadedBy: "Pooja Iyer", role: "Tutor", size: "3.1 MB", uploadedOn: "May 4, 2024", downloads: 478 },
  { id: "f4", name: "Accounting Notes.docx", section: "Commerce", uploadedBy: "Arjun Verma", role: "Moderator", size: "1.8 MB", uploadedOn: "May 3, 2024", downloads: 315 },
  { id: "f5", name: "History Timeline.pptx", section: "Humanities", uploadedBy: "Riya Sharma", role: "Student", size: "4.5 MB", uploadedOn: "May 2, 2024", downloads: 289 },
  { id: "f6", name: "English Grammar Rules.pdf", section: "Common", uploadedBy: "Aditya Singh", role: "Student", size: "2.0 MB", uploadedOn: "May 2, 2024", downloads: 405 },
  { id: "f7", name: "Board Exam Notice.pdf", section: "Common", uploadedBy: "Kabir Khan", role: "Admin", size: "890 KB", uploadedOn: "May 1, 2024", downloads: 623 },
  { id: "f8", name: "Model Test Answers.xlsx", section: "Science", uploadedBy: "Meera Joshi", role: "Tutor", size: "1.6 MB", uploadedOn: "Apr 30, 2024", downloads: 371 },
  { id: "f9", name: "Previous Year Papers (2021-2023).zip", section: "Common", uploadedBy: "Aarav Mehta", role: "Admin", size: "28.7 MB", uploadedOn: "Apr 29, 2024", downloads: 892 },
];

const eventList: GroupEvent[] = [
  { id: "e1", title: "Weekly Mock Test — All Subjects", date: "MAY 22", day: "WED", time: "10:00 AM – 12:00 PM", section: "All Subjects", host: "Aditya Singh", going: 128, mode: "Online" },
  { id: "e2", title: "Physics Revision Session", date: "MAY 25", day: "SAT", time: "06:00 PM – 07:30 PM", section: "Science", host: "Neha Patel", going: 96, mode: "Online" },
  { id: "e3", title: "Strategy & Time Management Workshop", date: "MAY 28", day: "TUE", time: "05:00 PM – 06:30 PM", section: "All Members", host: "Pooja Iyer", going: 75, mode: "Live Session" },
  { id: "e4", title: "English Grammar Marathon", date: "JUN 02", day: "SUN", time: "04:00 PM – 06:00 PM", section: "Humanities", host: "Riya Sharma", going: 63, mode: "Online" },
  { id: "e5", title: "Board Pattern Discussion", date: "JUN 05", day: "WED", time: "07:00 PM – 08:00 PM", section: "All Members", host: "Arjun Verma", going: 54, mode: "Upcoming" },
  { id: "e6", title: "Maths Problem Solving Challenge", date: "JUN 08", day: "SAT", time: "11:00 AM – 01:00 PM", section: "Commerce", host: "Kabir Khan", going: 82, mode: "Online" },
];

const postList: GroupPost[] = [
  { id: "p1", author: "Riya Sharma", initials: "RS", section: "Science", time: "30m ago", body: "What is the difference between the Bohr model and the quantum mechanical model of an atom? Can someone explain with a simple example?", likes: 18, comments: 12 },
  { id: "p2", author: "Arjun Verma", initials: "AV", section: "Commerce", time: "45m ago", body: "Uploaded my short notes on Accounting Equation and its applications. Hope this helps!", likes: 24, comments: 9, attachment: { name: "Accounting Equation — Short Notes.pdf", meta: "1.4 MB · 6 pages" } },
  { id: "p3", author: "Neha Patel", initials: "NP", section: "Humanities", time: "1h ago", body: "Quick revision notes on the Revolt of 1857 — causes, key leaders and outcomes. Useful for exams.", likes: 31, comments: 15 },
  { id: "p4", author: "Ayush Mehta", initials: "AM", section: "Common", time: "2h ago", body: "Reminder: weekly doubt clearing session for all sections tomorrow at 7:00 PM in the Common Study Room. Bring your questions and let's clear them together.", likes: 42, comments: 7 },
];

const rules = [
  "Be respectful and kind to everyone",
  "No spam or irrelevant content",
  "Help others and share knowledge",
  "Use proper language at all times",
  "Give credit when sharing resources",
  "No personal promotions",
  "Respect moderators and follow instructions",
  "Violations may lead to removal from the group",
];

export const studyGroups: StudyGroup[] = [
  {
    id: "ssc-2026-batch",
    name: "SSC 2026 Batch",
    batch: "SSC · 2026 Batch",
    privacy: "Public Group",
    tagline: "Let's prepare together, support each other, and achieve success in SSC 2026.",
    description:
      "This is the official SSC 2026 Batch group for all students. Our goal is to help every student prepare smartly with daily updates, live study rooms, notes and discussions. We learn together, grow together and achieve success together.",
    tags: ["Science", "Commerce", "Humanities"],
    createdOn: "10 January, 2024",
    createdBy: "Learns Academy Team",
    language: "English",
    members: 248,
    onlineNow: 36,
    rooms: 18,
    files: 312,
    joined: true,
    sections,
    memberList,
    roomList,
    fileList,
    eventList,
    postList,
    rules,
  },
  {
    id: "hsc-2027-science",
    name: "HSC 2027 Science Hub",
    batch: "HSC · 2027 Batch",
    privacy: "Public Group",
    tagline: "Physics, Chemistry and Higher Math — solved together, every single day.",
    description:
      "A focused group for HSC 2027 science students. Daily doubt sessions, chapter-wise notes and weekly mock tests keep the whole batch on track.",
    tags: ["Science", "Higher Math"],
    createdOn: "4 March, 2024",
    createdBy: "Meera Joshi",
    language: "English",
    members: 164,
    onlineNow: 21,
    rooms: 11,
    files: 187,
    joined: false,
    sections: sections.slice(0, 1),
    memberList: memberList.slice(0, 5),
    roomList: roomList.slice(0, 5),
    fileList: fileList.slice(0, 5),
    eventList: eventList.slice(0, 4),
    postList: postList.slice(0, 3),
    rules,
  },
  {
    id: "commerce-toppers",
    name: "Commerce Toppers Club",
    batch: "SSC & HSC · Commerce",
    privacy: "Private Group",
    tagline: "Accounting, Finance and Business Studies — practice sets every evening.",
    description:
      "A discussion-first group for commerce students who want to master accounting entries and business case studies with peer review.",
    tags: ["Commerce", "Accounting"],
    createdOn: "18 February, 2024",
    createdBy: "Arjun Verma",
    language: "English",
    members: 132,
    onlineNow: 14,
    rooms: 8,
    files: 121,
    joined: false,
    sections: sections.slice(1, 2),
    memberList: memberList.slice(2, 7),
    roomList: roomList.slice(1, 5),
    fileList: fileList.slice(3, 8),
    eventList: eventList.slice(2, 6),
    postList: postList.slice(1, 4),
    rules,
  },
  {
    id: "humanities-circle",
    name: "Humanities Study Circle",
    batch: "SSC · 2026 Batch",
    privacy: "Public Group",
    tagline: "History, Civics and Geography explained through stories and timelines.",
    description:
      "For students who love reading and want structured revision of humanities subjects with shared timelines and map work.",
    tags: ["Humanities", "History"],
    createdOn: "22 April, 2024",
    createdBy: "Riya Sharma",
    language: "English",
    members: 98,
    onlineNow: 9,
    rooms: 6,
    files: 84,
    joined: false,
    sections: sections.slice(2, 3),
    memberList: memberList.slice(3, 8),
    roomList: roomList.slice(2, 6),
    fileList: fileList.slice(2, 7),
    eventList: eventList.slice(1, 5),
    postList: postList.slice(0, 2),
    rules,
  },
];

export const getGroup = (id: string): StudyGroup | undefined =>
  studyGroups.find((g) => g.id === id);
