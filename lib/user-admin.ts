import { prisma } from "./prisma";

export async function getAllUsersWithRoles(search?: string) {
  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      roles: { include: { programme: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    staffNo: u.staffNo,
    isActive: u.isActive,
    roles: u.roles.map((r) => ({
      id: r.id,
      role: r.role,
      programmeCode: r.programme?.code ?? null,
    })),
  }));
}
