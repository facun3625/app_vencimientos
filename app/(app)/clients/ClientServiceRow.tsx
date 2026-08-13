"use client";
import { useEffect, useState, useTransition } from "react";
import { Calendar, CheckCircle2, DollarSign, Pencil, RefreshCcw, Save, X, FileText, Send } from "lucide-react";
import { updateContractAction, updateOneTimeAction } from "../services/actions";
import PaidToggle from "../services/PaidToggle";
import { formatMoney } from "@/lib/money";
import DeleteServiceButton from "../services/DeleteServiceButton";

const toDateInput = (v: any) => (v ? new Date(v).toISOString().split("T")[0] : "");

export default function ClientServiceRow({
  service,
  serviceBases,
  monthlyCosts = [],
}: {
  service: any;
  serviceBases: any[];
  monthlyCosts?: any[];
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isRecurring = service.viewType === "RECURRING";

  const [frequency, setFrequency] = useState(service.frequency ?? "MONTHLY");
  const [dateValue, setDateValue] = useState(
    toDateInput(isRecurring ? service.expirationDate : service.deliveryDate)
  );
  const [isPaid, setIsPaid] = useState(!!service.isPaid);
  const [invoiced, setInvoiced] = useState(!!service.invoiced);
  const [invoiceSent, setInvoiceSent] = useState(!!service.invoiceSent);

  useEffect(() => {
    if (editing) {
      setFrequency(service.frequency ?? "MONTHLY");
      setDateValue(toDateInput(isRecurring ? service.expirationDate : service.deliveryDate));
      setIsPaid(!!service.isPaid);
      setInvoiced(!!service.invoiced);
      setInvoiceSent(!!service.invoiceSent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            if (isRecurring) await updateContractAction(service.contractId, service.paymentId, formData);
            else await updateOneTimeAction(service.id, formData);
            setEditing(false);
          });
        }}
        className="flex flex-col gap-4 px-6 py-4 bg-white/[0.02]"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group md:col-span-2">
            <label className="form-label text-[10px]">Servicio del Catálogo</label>
            <select name="serviceBaseId" defaultValue={service.serviceBaseId} required className="form-input">
              {serviceBases.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.description ? ` — ${b.description}` : ""}
                </option>
              ))}
            </select>
          </div>

          {isRecurring ? (
            <>
              <div className="form-group">
                <label className="form-label text-[10px]">Frecuencia</label>
                <div className="relative">
                  <RefreshCcw className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/50" size={14} />
                  <select
                    name="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    required
                    className="form-input !pl-9"
                  >
                    <option value="MONTHLY">Mensual</option>
                    <option value="QUARTERLY">Trimestral</option>
                    <option value="BIANNUAL">Semestral</option>
                    <option value="ANNUAL">Anual</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label text-[10px]">Vencimiento de este Período</label>
                <div
                  className="relative cursor-pointer"
                  onClick={(e) => {
                    const input = e.currentTarget.querySelector("input");
                    if (input && "showPicker" in input) (input as any).showPicker();
                  }}
                >
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/50" size={14} />
                  <input
                    name="startDate"
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    required
                    className="form-input !pl-9 cursor-pointer"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label text-[10px]">Costo</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400/50" size={14} />
                  <input name="cost" type="number" step="0.01" defaultValue={service.cost} className="form-input !pl-9" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label text-[10px]">Precio</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/50" size={14} />
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={service.price}
                    required
                    className="form-input !pl-9 font-bold text-emerald-400"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label text-[10px]">Fecha Entrega</label>
                <div
                  className="relative cursor-pointer"
                  onClick={(e) => {
                    const input = e.currentTarget.querySelector("input");
                    if (input && "showPicker" in input) (input as any).showPicker();
                  }}
                >
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/50" size={14} />
                  <input
                    name="deliveryDate"
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    className="form-input !pl-9 cursor-pointer"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label text-[10px]">Costo</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400/50" size={14} />
                  <input name="internalCost" type="number" step="0.01" defaultValue={service.internalCost} className="form-input !pl-9" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label text-[10px]">Precio</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/50" size={14} />
                  <input
                    name="finalPrice"
                    type="number"
                    step="0.01"
                    defaultValue={service.finalPrice}
                    required
                    className="form-input !pl-9 font-bold text-emerald-400"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group md:col-span-4">
            <label className="form-label text-[10px]">Notas</label>
            <input name="notes" defaultValue={service.notes ?? ""} placeholder="Notas adicionales..." className="form-input" />
          </div>
        </div>

        {isRecurring && monthlyCosts.length > 0 && (
          <div>
            <label className="form-label text-[10px] mb-2 block">Costos Mensuales Compartidos (suman al costo)</label>
            <div className="flex flex-wrap gap-3">
              {monthlyCosts.map((mc: any) => (
                <label key={mc.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    name="monthlyCostIds"
                    value={mc.id}
                    defaultChecked={service.monthlyCosts?.some((linked: any) => linked.id === mc.id)}
                    className="w-3.5 h-3.5 accent-red-500"
                  />
                  {mc.name} <span className="text-[var(--text-muted)]">(${mc.amount}/mes total)</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer w-fit">
            <input
              type="checkbox"
              name="isPaid"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className={`flex items-center gap-2 font-semibold text-sm ${isPaid ? "text-emerald-400" : "text-amber-500"}`}>
              <CheckCircle2 size={16} />
              {isPaid ? "Cobrado" : "Pendiente de cobro"}
            </span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer w-fit">
            <input
              type="checkbox"
              name="invoiced"
              checked={invoiced}
              onChange={(e) => setInvoiced(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <span className={`flex items-center gap-2 font-semibold text-sm ${invoiced ? "text-blue-400" : "text-[var(--text-muted)]"}`}>
              <FileText size={16} />
              {invoiced ? "Facturado" : "Sin facturar"}
            </span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer w-fit">
            <input
              type="checkbox"
              name="invoiceSent"
              checked={invoiceSent}
              onChange={(e) => setInvoiceSent(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
            <span className={`flex items-center gap-2 font-semibold text-sm ${invoiceSent ? "text-cyan-400" : "text-[var(--text-muted)]"}`}>
              <Send size={16} />
              {invoiceSent ? "Factura Enviada" : "Sin enviar"}
            </span>
          </label>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={isPending} className="btn btn-primary btn-sm">
            <Save size={14} /> {isPending ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">
            <X size={14} /> Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap justify-between items-center gap-3 px-6 py-3">
      <div>
        <p className="text-sm font-semibold text-white">{service.serviceBase.name}</p>
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{service.displayFreq}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Vencimiento</p>
          <p className="text-xs font-bold text-amber-500 flex items-center gap-1 justify-end">
            <Calendar size={12} /> {service.dueDateLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Monto</p>
          <p className="text-sm font-black text-emerald-400 font-mono">{formatMoney(service.price, service.currency)}</p>
        </div>
        {service.invoiced && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-tighter bg-blue-500/10 text-blue-400" title="Facturado">
            <FileText size={11} /> Facturado
          </span>
        )}
        {service.invoiceSent && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-tighter bg-cyan-500/10 text-cyan-400" title="Factura Enviada">
            <Send size={11} /> Enviada
          </span>
        )}
        <PaidToggle
          id={isRecurring ? service.paymentId : service.id}
          type={isRecurring ? "contract" : "onetime"}
          isPaid={service.isPaid}
        />
        <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm p-1" title="Editar servicio">
          <Pencil size={12} />
        </button>
        <DeleteServiceButton id={isRecurring ? service.contractId : service.id} type={isRecurring ? "contract" : "onetime"} />
      </div>
    </div>
  );
}
