
function PostApprovalSection({ group, tick }: { group: StudyGroup; tick: number }) {
  const { draft, set, save, dirty, saved } = useSettingsDraft(group, tick);

  return (
    <Panel icon={ShieldCheck} title="Content Approval" hint="Manage how posts are approved in this group">
      <Toggle
        label="Post approval system"
        hint="Posts from members need admin approval before appearing"
        checked={draft.postsNeedApproval}
        onChange={(v) => set("postsNeedApproval", v)}
      />
      {draft.postsNeedApproval && (
        <Toggle
          label="Auto-approve trusted members"
          hint="Moderators and Tutors can post without approval"
          checked={true}
          onChange={() => {}}
        />
      )}
      <SaveBar dirty={dirty} onSave={save} saved={saved} />
    </Panel>
  );
}
