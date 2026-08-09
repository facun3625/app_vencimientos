"use client";
import { useState, useTransition } from "react";
import { LogIn } from "lucide-react";
import { startImpersonationAction } from "../actions";
import ConfirmModal from "@/components/ConfirmModal";

export default function ImpersonateButton({
  userId,
  userName,
  isSuperAdmin,
}: {
  userId: string;
  userName: string;
  isSuperAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (isSuperAdmin) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="btn btn-secondary !py-1.5 !px-3 text-xs"
      >
        <LogIn size={12} /> Ingresar como
      </button>

      <ConfirmModal
        open={open}
        title="Ingresar como otro usuario"
        message={`¿Entrar a la app como "${userName}"? Vas a ver todo exactamente como lo ve esa cuenta.`}
        confirmLabel="Ingresar"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          startTransition(async () => { await startImpersonationAction(userId); });
        }}
      />
    </>
  );
}
