"use client";

import { useState, useRef, useEffect } from "react";

type User = { id: number; name: string };

export function UserPicker({
  users,
  onSelect,
  onCreateUser,
  placeholder = "Search or add a user...",
}: {
  users: User[];
  onSelect: (user: User) => void;
  onCreateUser: (name: string) => Promise<User>;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase())
  );
  const exactMatch = users.some(
    (u) => u.name.toLowerCase() === query.toLowerCase()
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleCreate() {
    if (!query.trim() || creating) return;
    setCreating(true);
    try {
      const user = await onCreateUser(query.trim());
      onSelect(user);
      setQuery("");
      setOpen(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {open && (query || filtered.length > 0) && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onSelect(user);
                setQuery("");
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              {user.name}
            </button>
          ))}
          {query.trim() && !exactMatch && (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full border-t px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
            >
              {creating ? "Adding..." : `+ Add "${query.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
