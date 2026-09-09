"use client";

import { useActionState, useState } from "react";
import { removeRoleAction, type RemoveRoleState } from "@/app/actions/user-admin";
import { setUserActiveAction, type SetUserActiveState } from "@/app/actions/user-admin";
import {
  adminResetPasswordAction,
  type AdminResetPasswordState,
} from "@/app/actions/password-reset";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/roles";

type UserRow = {
  id: string;
  name: string;
  email: string;
  staffNo: string | null;
  isActive: boolean;
  roles: { id: string; role: string; programmeCode: string | null }[];
};

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  if (users.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Tiada pengguna sepadan.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
            <th className="px-4 py-3 font-medium">Nama</th>
            <th className="px-4 py-3 font-medium">Emel</th>
            <th className="px-4 py-3 font-medium">Peranan</th>
            <th className="px-4 py-3 font-medium">Tindakan</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <UserRowItem key={u.id} user={u} isSelf={u.id === currentUserId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const initialRemoveState: RemoveRoleState = {};
const initialActiveState: SetUserActiveState = {};
const initialResetState: AdminResetPasswordState = {};

function UserRowItem({ user, isSelf }: { user: UserRow; isSelf: boolean }) {
  const [isResetting, setIsResetting] = useState(false);
  const [activeState, activeAction, isTogglingActive] = useActionState(
    setUserActiveAction,
    initialActiveState
  );
  const [resetState, resetAction, isReseting] = useActionState(
    adminResetPasswordAction,
    initialResetState
  );

  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="px-4 py-3 text-foreground">
        {user.name}
        {!user.isActive && (
          <span className="ml-2 text-xs font-normal text-muted-foreground italic">
            (tidak aktif)
          </span>
        )}
        {isSelf && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            (anda)
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
      <td className="px-4 py-3">
        {user.roles.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">
            Tiada peranan
          </span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {user.roles.map((r) => (
              <RoleChip
                key={r.id}
                userRoleId={r.id}
                label={ROLE_LABEL[r.role] ?? r.role}
                programmeCode={r.programmeCode}
              />
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsResetting((v) => !v)}
            >
              Reset Kata Laluan
            </Button>
            <form
              action={activeAction}
              onSubmit={(e) => {
                if (
                  user.isActive &&
                  !confirm(
                    `Nyahaktifkan akaun ${user.name}? Dia tidak akan boleh log masuk lagi.`
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="userId" value={user.id} />
              <input
                type="hidden"
                name="isActive"
                value={user.isActive ? "false" : "true"}
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={isTogglingActive || isSelf}
                title={isSelf ? "Tidak boleh nyahaktifkan akaun sendiri" : undefined}
              >
                {user.isActive ? "Nyahaktif" : "Aktifkan"}
              </Button>
            </form>
          </div>
          {activeState?.error && (
            <p role="alert" className="text-xs text-destructive">
              {activeState.error}
            </p>
          )}

          {isResetting && (
            <form
              action={resetAction}
              className="mt-1 flex items-center gap-2 rounded-md border border-border bg-muted/20 p-2"
            >
              <input type="hidden" name="userId" value={user.id} />
              <input
                type="password"
                name="newPassword"
                placeholder="Kata laluan baharu (min. 8 aksara)"
                required
                minLength={8}
                className="w-56 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button type="submit" size="sm" disabled={isReseting}>
                {isReseting ? "..." : "Tetapkan"}
              </Button>
            </form>
          )}
          {resetState?.error && (
            <p role="alert" className="text-xs text-destructive">
              {resetState.error}
            </p>
          )}
          {resetState?.success && (
            <p className="text-xs text-emerald-700">
              Kata laluan telah ditetapkan semula.
            </p>
          )}
        </div>
      </td>
    </tr>
  );
}

function RoleChip({
  userRoleId,
  label,
  programmeCode,
}: {
  userRoleId: string;
  label: string;
  programmeCode: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    removeRoleAction,
    initialRemoveState
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="userRoleId" value={userRoleId} />
      <button
        type="submit"
        disabled={isPending}
        title="Klik untuk buang peranan ini"
        className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground hover:bg-destructive hover:text-white disabled:opacity-50"
      >
        {label}
        {programmeCode && (
          <span className="opacity-70">&middot; {programmeCode}</span>
        )}
        <span aria-hidden className="ml-0.5">
          &times;
        </span>
      </button>
      {state?.error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
