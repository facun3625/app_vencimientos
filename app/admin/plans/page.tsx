import { prisma } from "@/lib/prisma";
import PlanForm from "./PlanForm";

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { priceAmount: "asc" } });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Planes</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Precio, límites y funciones de cada plan. Se muestran en <code>/precios</code> y se usan para bloquear cuando alguien supera su límite.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <PlanForm key={plan.tier} plan={plan} />
        ))}
      </div>
    </div>
  );
}
