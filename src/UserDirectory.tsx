import { useEffect, useState } from "react";
import { fetchUsers, type Page, type Role, type User } from "./mockApi";

// ===========================================================================
// FE INTERVIEW — "User Directory"
//
// This component works, but it has problems. Investigate and improve it.
// Here's what users are reporting — diagnose the cause and decide what to do:
//
//   1. "The table feels janky while I type in Search." (open React DevTools
//      and watch what renders on each keystroke — explain WHY, then fix it.)
//   2. "The Quick filter box barely finds anything." (it filters the rows
//      currently on screen, in-memory — see quickFilter().)
//   3. "Paging back and forth is slow every time, even to pages I just saw."
//      (the backend takes ~700ms. Also: does the UI ever show stale results?)
//   4. "Search is slow and the app seems to spam the backend." (one request
//      per keystroke against a slow API — make it responsive.)
//   5. A security review flagged how a user's `bio` is displayed. Find it.
//
// You may add files/hooks. Do not edit mockApi.ts — treat it as a real API.
// ===========================================================================

const PAGE_SIZE = 50;

// Stands in for real per-cell work (date/currency formatting, a tiny sparkline,
// a computed badge…). A few ms per row — negligible once, painful ×50 ×keystroke.
function expensiveCell(user: User): string {
  let acc = 0;
  for (let i = 0; i < 2_000_000; i++) acc += (user.id * i) % 7;
  return acc % 2 === 0 ? user.role : user.role.toUpperCase();
}

// --- (2) FILTERING -------------------------------------------------------
// In-memory filter over the rows currently on screen (no refetch).
function quickFilter(users: User[], text: string): User[] {
  const q = text;
  if (!q) return users;
  return users.filter(
    (u) => u.name.toLowerCase().includes(q) && u.email.toLowerCase().includes(q)
  );
}

// --- (1) RE-RENDERS ------------------------------------------------------
// This renders once per user. It is NOT memoized and receives a fresh
// onSelect function + style object on every parent render.
function Row(props: {
  user: User;
  onSelect: (u: User) => void;
  selected: boolean;
}) {
  const { user, onSelect, selected } = props;
  return (
    <tr
      style={{ background: selected ? "#eef" : "transparent", cursor: "pointer" }}
      onClick={() => onSelect(user)}
    >
      <td>{user.id}</td>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>{expensiveCell(user)}</td>
      <td>{user.active ? "active" : "inactive"}</td>
    </tr>
  );
}

export function UserDirectory() {
  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [data, setData] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);

  // --- (3)/(4) FETCHING ---------------------------------------------------
  // No cache, no debounce, no abort. Races: a slow earlier request can land
  // after a faster later one and overwrite the UI with stale data.
  useEffect(() => {
    setLoading(true);
    fetchUsers({ page, pageSize: PAGE_SIZE, search, role, activeOnly }).then(
      (res) => {
        setData(res);
        setLoading(false);
      }
    );
  }, [page, search, role, activeOnly]);

  const rows = data ? quickFilter(data.users, quick) : [];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div style={{ maxWidth: 820, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>User Directory</h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="Search name/email (hits backend)…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <input
          placeholder="Quick filter (this page only)…"
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
        />
        <select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value as Role | "all");
          }}
        >
          <option value="all">All roles</option>
          <option value="admin">admin</option>
          <option value="editor">editor</option>
          <option value="viewer">viewer</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => {
              setPage(1);
              setActiveOnly(e.target.checked);
            }}
          />
          Active only
        </label>
      </div>

      <p>{loading ? "Loading…" : `${data?.total ?? 0} users`}</p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <Row
              key={u.id}
              user={u}
              selected={selected?.id === u.id}
              onSelect={(usr) => setSelected(usr)}
            />
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      {selected && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ccc" }}>
          <h3>{selected.name}</h3>
          {/* --- (5) SECURITY ------------------------------------------- */}
          <div dangerouslySetInnerHTML={{ __html: selected.bio }} />
        </div>
      )}
    </div>
  );
}
