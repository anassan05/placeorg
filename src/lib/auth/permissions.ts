import type { Actor, Role } from "./session";

// This matrix grants only actions implemented today. Add new permissions alongside
// their server-side implementation and resource-level tests, never pre-grant them.
export type Permission = "session:read";
const matrix: Readonly<Record<Role, readonly Permission[]>> = {
  PLATFORM_SUPER_ADMIN: ["session:read"], COLLEGE_ADMIN: ["session:read"],
  PLACEMENT_OFFICER: ["session:read"], COORDINATOR: ["session:read"], STUDENT: ["session:read"],
};
export function can(actor: Actor | null, permission: string): boolean {
  if (!actor || !Object.hasOwn(matrix, actor.role)) return false;
  const isPlatform = actor.role === "PLATFORM_SUPER_ADMIN";
  if (!actor.id || (isPlatform ? actor.collegeId !== null : !actor.collegeId)) return false;
  return (matrix[actor.role] as readonly string[]).includes(permission);
}
