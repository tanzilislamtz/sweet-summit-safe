# Plan: Study Group Room Creation & Privacy Enhancements

This plan outlines the implementation of a user-driven study room creation system within the "Learns Academy" study groups, featuring Discord-style room management, joining limits, and privacy controls (Public/Private with invite links).

## User Improvements
- Users can now create study rooms within their joined groups.
- Set participant limits for rooms to control study session size.
- Toggle between Public (anyone can join/share) and Private (invite-only) rooms.
- Generate and share invite links for Private rooms.

## Technical Details

### 1. Data Models (`src/data/groups.ts`)
- Update `GroupRoom` type to include:
    - `limit?: number` (max participants).
    - `privacy: 'Public' | 'Private'`.
    - `inviteCode?: string` (for private access).
    - `createdBy: string` (user session ID/name).

### 2. Logic Layer (`src/lib/group-workspace.ts`)
- Add `addRoom(groupId, roomData)`: persist user-created rooms to `localStorage`.
- Add `listRooms(groupId)`: merge demo rooms with user-created rooms.
- Add `joinRoom(groupId, roomId)`: handle participant count and limits.
- Update `applyGroupOverrides` to handle room state.

### 3. UI Components (`src/routes/group-study.$groupId.tsx`)
- **Rooms Tab Refresh**:
    - Add a "Create Room" button (visible if user has permissions).
    - Implement a `CreateRoomModal` with fields for Title, Focus, Section, Limit, and Privacy.
- **Room Cards**:
    - Show `x/limit` participants.
    - Show Privacy icon (Globe/Lock).
    - "Join" button logic: disable if full or private (unless invite code matches).
    - Add "Share Invite" button for private rooms (copies link with `?room=code`).

### 4. Navigation & Access
- Handle deep-linking for private room invites in the `useEffect` of the group workspace.

## Security & Validation
- Permissions check: Ensure `membersCanCreateRooms` setting is respected.
- Participant limit enforcement in the join logic.
