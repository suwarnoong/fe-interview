// ---------------------------------------------------------------------------
// Mock backend. DO NOT EDIT during the interview — treat this as a real API you
// cannot change. It is intentionally slow (large dataset + network latency) so
// the client has to be smart about fetching, caching, and debouncing.
// ---------------------------------------------------------------------------

export type Role = "admin" | "editor" | "viewer";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  /** Free-text, user-controlled. May contain markup. */
  bio: string;
}

export interface Page {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

const ROLES: Role[] = ["admin", "editor", "viewer"];
const TOTAL = 10_000;

// Deterministic pseudo-data so results are stable across reloads.
const DB: User[] = Array.from({ length: TOTAL }, (_, i) => {
  const id = i + 1;
  const role = ROLES[i % ROLES.length];
  return {
    id,
    name: `${["Ava", "Ben", "Cara", "Dan", "Eve", "Finn"][i % 6]} ${
      ["Khan", "Lee", "Mehta", "Novak", "Osei", "Park"][(i >> 3) % 6]
    } #${id}`,
    email: `user${id}@example.com`,
    role,
    active: i % 4 !== 0,
    // One in ~50 users has a malicious bio. This is the security test.
    bio:
      id % 50 === 0
        ? `<img src=x onerror="alert('xss-'+${id})">Totally normal bio`
        : `Hi, I'm user ${id}. I like TypeScript & React.`,
  };
});

export interface Query {
  page: number;
  pageSize: number;
  search: string;
  role: Role | "all";
  activeOnly: boolean;
}

function matches(u: User, q: Query): boolean {
  const needle = q.search.trim().toLowerCase();
  const hay = `${u.name} ${u.email}`.toLowerCase();
  const okSearch = needle === "" || hay.includes(needle);
  const okRole = q.role === "all" || u.role === q.role;
  const okActive = !q.activeOnly || u.active;
  return okSearch && okRole && okActive;
}

const LATENCY_MS = 700;

/** Simulates GET /users?page=&pageSize=&search=&role=&activeOnly= */
export function fetchUsers(q: Query, signal?: AbortSignal): Promise<Page> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const all = DB.filter((u) => matches(u, q));
      const start = (q.page - 1) * q.pageSize;
      resolve({
        users: all.slice(start, start + q.pageSize),
        total: all.length,
        page: q.page,
        pageSize: q.pageSize,
      });
    }, LATENCY_MS);

    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}
