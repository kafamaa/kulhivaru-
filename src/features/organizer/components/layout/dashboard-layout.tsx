"use client";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { OrganizerWorkspaceProvider } from "./organizer-workspace-context";
import type { OrganizerOrganization } from "../../types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  organizations?: OrganizerOrganization[];
  selectedOrgId?: string | null;
}

export function DashboardLayout({
  children,
  title,
  organizations = [],
  selectedOrgId = null,
}: DashboardLayoutProps) {
  return (
    <OrganizerWorkspaceProvider>
      <div className="flex min-h-screen bg-slate-950 text-slate-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            title={title}
            organizations={organizations}
            selectedOrgId={selectedOrgId}
          />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </OrganizerWorkspaceProvider>
  );
}
