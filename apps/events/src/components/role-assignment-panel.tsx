"use client";

import { useState } from "react";
import { UserPicker } from "@convent/ui";
import { assignRole, removeRole } from "../actions/roles";
import { createUser } from "../actions/users";

type User = { id: number; name: string };
type Role = { id: number; userId: number; role: string; user: User };

const AVAILABLE_ROLES = [
  "Host",
  "Setup",
  "Cleanup",
  "Greeting",
  "A/V",
  "Kitchen",
  "Security",
  "Other",
];

export function RoleAssignmentPanel({
  eventId,
  assignedRoles,
  allUsers,
}: {
  eventId: number;
  assignedRoles: Role[];
  allUsers: User[];
}) {
  const [selectedRole, setSelectedRole] = useState(AVAILABLE_ROLES[0]);
  const [users, setUsers] = useState(allUsers);

  async function handleAssign(user: User) {
    await assignRole(eventId, user.id, selectedRole);
  }

  async function handleCreateUser(name: string) {
    const user = await createUser(name);
    setUsers((prev) => [...prev, user]);
    return user;
  }

  async function handleRemove(userId: number, role: string) {
    await removeRole(eventId, userId, role);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Role Assignments</h3>

      <div className="flex gap-3">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {AVAILABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <div className="flex-1">
          <UserPicker
            users={users}
            onSelect={handleAssign}
            onCreateUser={handleCreateUser}
            placeholder={`Assign someone to ${selectedRole}...`}
          />
        </div>
      </div>

      {assignedRoles.length > 0 ? (
        <div className="space-y-2">
          {AVAILABLE_ROLES.map((role) => {
            const roleAssignments = assignedRoles.filter(
              (r) => r.role === role
            );
            if (roleAssignments.length === 0) return null;
            return (
              <div key={role}>
                <div className="text-sm font-medium text-gray-500">{role}</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {roleAssignments.map((ra) => (
                    <span
                      key={ra.id}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {ra.user.name}
                      <button
                        onClick={() => handleRemove(ra.userId, ra.role)}
                        className="ml-1 text-blue-500 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No one assigned yet.</p>
      )}
    </div>
  );
}
