"use client";

import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/lib/roles";

type ProfileMenuProps = {
  fullName: string;
  phone: string;
  role: string;
  onSignOut: () => Promise<void>;
};

export function ProfileMenu({
  fullName,
  phone,
  role,
  onSignOut,
}: ProfileMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm">
              <User />
              Profil
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex flex-col gap-0.5 px-1.5 py-1.5">
            <p className="text-sm font-medium">{fullName}</p>
            <p className="text-xs text-muted-foreground">{phone}</p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABELS[role] ?? role}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setMenuOpen(false);
              setConfirmOpen(true);
            }}
          >
            <LogOut />
            Chiqish
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chiqishni tasdiqlang</DialogTitle>
            <DialogDescription>
              Rostdan ham tizimdan chiqmoqchimisiz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Bekor qilish
            </Button>
            <form action={onSignOut}>
              <Button variant="destructive" type="submit" className="w-full">
                Chiqish
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
