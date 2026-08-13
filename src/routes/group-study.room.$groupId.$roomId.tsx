import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/group-study/room/$groupId/$roomId')({
  component: () => <div>Study Room</div>,
});
