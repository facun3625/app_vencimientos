import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import ExpenseForm from "./ExpenseForm";
import ExpenseRow from "./ExpenseRow";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const workspaceId = (session.user as any).workspaceId;

  const params = await searchParams;
  const monthParam = params.month || format(new Date(), "yyyy-MM");
  const [y, m] = monthParam.split("-").map(Number);
  const monthDate = new Date(y, m - 1, 1);
  const prevMonthStr = format(subMonths(monthDate, 1), "yyyy-MM");
  const nextMonthStr = format(addMonths(monthDate, 1), "yyyy-MM");
  const currentMonthStr = format(new Date(), "yyyy-MM");

  const expenses = await prisma.monthlyExpense.findMany({
    where: {
      workspaceId,
      month: { gte: new Date(`${monthParam}-01`), lt: addMonths(new Date(`${monthParam}-01`), 1) },
    },
    orderBy: { createdAt: "asc" },
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="page-container">
      <div className="page-header flex flex-wrap justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn btn-secondary !p-2 rounded-full overflow-hidden" title="Volver al Dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><Wallet size={20} /></div>
            <div>
              <h1 className="page-title !mb-0">Gastos Mensuales</h1>
              <p className="page-subtitle text-xs">Costos operativos que varían de mes a mes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6 bg-white/5 p-2 rounded-xl border border-white/5 w-fit">
        <Link href={`/expenses?month=${prevMonthStr}`} className="btn btn-secondary !p-2 rounded-full">
          <ChevronLeft size={16} />
        </Link>
        <span className="font-bold text-white capitalize px-2 min-w-[160px] text-center">
          {format(monthDate, "MMMM yyyy", { locale: es })}
        </span>
        <Link href={`/expenses?month=${nextMonthStr}`} className="btn btn-secondary !p-2 rounded-full">
          <ChevronRight size={16} />
        </Link>
        {monthParam !== currentMonthStr && (
          <Link href={`/expenses?month=${currentMonthStr}`} className="btn btn-secondary !px-3 !text-xs">
            Hoy
          </Link>
        )}
      </div>

      <div className="card !p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Gastos de {format(monthDate, "MMMM yyyy", { locale: es })}</h2>
          <span className="text-2xl font-black text-red-400 font-mono">${total.toLocaleString("es-AR")}</span>
        </div>

        <div className="mb-4">
          <ExpenseForm month={monthParam} />
        </div>

        <div className="card !p-2 h-fit min-h-[60px]">
          {expenses.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)] italic">No hay gastos cargados este mes</div>
          ) : (
            expenses.map(e => <ExpenseRow key={e.id} expense={e} month={monthParam} />)
          )}
        </div>
      </div>
    </div>
  );
}
