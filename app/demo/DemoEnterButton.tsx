"use client";
import { useState, useTransition } from "react";
import { ArrowRight, FlaskConical } from "lucide-react";
import { enterDemoAction } from "./actions";

export default function DemoEnterButton() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => startTransition(async () => { const res = await enterDemoAction(); if (res?.error) setError(res.error); })}
        disabled={isPending}
        className="btn btn-primary h-12 px-8 text-base shadow-lg shadow-blue-500/20"
      >
        {isPending ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <FlaskConical size={18} /> Entrar a la demo <ArrowRight size={18} />
          </>
        )}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
