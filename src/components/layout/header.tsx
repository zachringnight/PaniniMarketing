"use client";

import { useProject } from "@/contexts/project-context";
import { UserMenu } from "./user-menu";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/types";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileSidebar } from "./mobile-sidebar";

export function Header() {
  const { user, role } = useProject();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <MobileSidebar />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-4">
        {role && (
          <Badge variant="secondary" className="text-xs">
            {ROLE_LABELS[role]}
          </Badge>
        )}
        {user && <UserMenu user={user} />}
      </div>
    </header>
  );
}
