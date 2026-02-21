"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project, User, ProjectMember } from "@/lib/types";
import type { UserRole } from "@/lib/types/database";

interface ProjectContextValue {
  user: User | null;
  project: Project | null;
  membership: ProjectMember | null;
  role: UserRole | null;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextValue>({
  user: null,
  project: null,
  membership: null,
  role: null,
  loading: true,
});

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [membership, setMembership] = useState<ProjectMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContext() {
      const supabase = createClient();

      // Get current auth user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profile) setUser(profile);

      // Get first project membership (MVP: single project)
      const { data: member } = await supabase
        .from("project_members")
        .select("*, projects(*)")
        .eq("user_id", authUser.id)
        .limit(1)
        .single();

      if (member) {
        setMembership(member);
        setProject((member as unknown as { projects: Project }).projects);
      }

      setLoading(false);
    }

    loadContext();
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        user,
        project,
        membership,
        role: membership?.role ?? null,
        loading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
