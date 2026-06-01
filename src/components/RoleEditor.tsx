const ALL_ROLES = ['customer', 'assistant'] as const;

export function RoleEditor({
  roles,
  onChange,
  disabled,
}: {
  roles: string[];
  onChange: (roles: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (role: string) => {
    if (disabled) return;
    if (roles.includes(role)) {
      if (roles.length <= 1) return;
      onChange(roles.filter((r) => r !== role));
    } else {
      onChange([...roles, role]);
    }
  };

  return (
    <div className="role-editor">
      <p className="role-editor-label">User roles & permissions</p>
      <div className="role-chips">
        {ALL_ROLES.map((role) => {
          const active = roles.includes(role);
          return (
            <button
              key={role}
              type="button"
              className={`role-chip${active ? ' active' : ''}`}
              onClick={() => toggle(role)}
              disabled={disabled}
            >
              {active ? '✓ ' : ''}
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          );
        })}
        {roles.includes('admin') && (
          <span className="role-chip active admin-locked" title="Admin role cannot be changed here">
            ✓ Admin
          </span>
        )}
      </div>
      <p className="role-hint">Users need at least one role. Admin accounts are managed separately.</p>
    </div>
  );
}
