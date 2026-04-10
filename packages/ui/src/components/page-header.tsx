"use client";

import { cn } from "../lib/utils";

const apps = [
  { name: "Events", href: "http://localhost:3001", color: "bg-purple-500" },
  { name: "Tours", href: "http://localhost:3002", color: "bg-green-500" },
  { name: "Residency", href: "http://localhost:3003", color: "bg-orange-500" },
];

export function PageHeader({
  currentApp,
  children,
}: {
  currentApp: "Events" | "Tours" | "Residency";
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <a href="/" className="text-lg font-bold">
            convent.fun
          </a>
          <nav className="flex gap-1">
            {apps.map((app) => (
              <a
                key={app.name}
                href={app.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  currentApp === app.name
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {app.name}
              </a>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </header>
  );
}
