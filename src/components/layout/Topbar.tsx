"use client";
import { Bell, Search } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <header className="h-16 flex items-center gap-4 px-6 border-b border-gray-100 bg-white sticky top-0 z-30">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-gray-900 leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Search className="w-4 h-4" />
        </button>
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
