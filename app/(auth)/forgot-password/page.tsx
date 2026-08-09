import AuthBackground from "@/components/AuthBackground";
import ForgotPasswordCard from "./ForgotPasswordCard";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
      <AuthBackground />

      <div className="relative z-10">
        <ForgotPasswordCard />

        <p className="text-center text-[10px] text-[var(--text-muted)] mt-8">
          &copy; 2026 Kairos. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
