"use client";
import { useState, useTransition, useEffect } from "react";
import { Repeat, Zap, Pencil, Calendar, RefreshCcw, DollarSign, CheckCircle2, X, Save, FileText, Send } from "lucide-react";
import { updateContractAction, updateOneTimeAction } from "./actions";
import PaidToggle from "./PaidToggle";
import DeleteServiceButton from "./DeleteServiceButton";

const toDateInput = (v: any) => (v ? new Date(v).toISOString().split("T")[0] : "");

export default function ServiceRow({ service, serviceBases, monthlyCosts = [] }: { service: any; serviceBases: any[]; monthlyCosts?: any[] }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isRecurring = service.viewType === "RECURRING";

  const [frequency, setFrequency] = useState(service.frequency ?? "MONTHLY");
  const [startDate, setStartDate] = useState(isRecurring ? toDateInput(service.expirationDate) : "");
  const [isPaid, setIsPaid] = useState(!!service.isPaid);
  const [invoiced, setInvoiced] = useState(!!service.invoiced);
  const [invoiceSent, setInvoiceSent] = useState(!!service.invoiceSent);

  // Re-sync the edit form's fields with the latest data every time it's opened,
  // instead of only once when this row first mounted (which could go stale).
  useEffect(() => {
    if (editing) {
      setFrequency(service.frequency ?? "MONTHLY");
      setStartDate(isRecurring ? toDateInput(service.expirationDate) : "");
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
        className="p-4 pl-10 md:pl-20 flex flex-col gap-4 bg-white/[0.02]"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group md:col-span-2">
            <label className="form-label text-[10px]">Servicio del Catálogo</label>
            <select name="serviceBaseId" defaultValue={service.serviceBaseId} required className="form-input">
              {serviceBases.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}{b.description ? ` — ${b.description}` : ""}</option>
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
                <div className="relative cursor-pointer" onClick={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  if (input && 'showPicker' in input) input.showPicker();
                }}>
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/50" size={14} />
                  <input
                    name="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
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
                  <input name="price" type="number" step="0.01" defaultValue={service.price} required className="form-input !pl-9 font-bold text-emerald-400" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label text-[10px]">Fecha Entrega</label>
                <div className="relative cursor-pointer" onClick={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  if (input && 'showPicker' in input) input.showPicker();
                }}>
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/50" size={14} />
                  <input name="deliveryDate" type="date" defaultValue={toDateInput(service.deliveryDate)} className="form-input !pl-9 cursor-pointer" />
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
                  <input name="finalPrice" type="number" step="0.01" defaultValue={service.finalPrice} required className="form-input !pl-9 font-bold text-emerald-400" />
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
          <button type="submit" disabled={isPending} className="btn btn-primary btn-sm"><Save size={14} /> {isPending ? "Guardando..." : "Guardar"}</button>
          <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-sm"><X size={14} /> Cancelar</button>
        </div>
      </form>
    );
  }

  return (
    <div className="p-4 pl-6 md:pl-20 flex flex-wrap items-center justify-between gap-y-3 gap-x-4 group hover:bg-white/[0.01] transition-colors">
      <div className="flex items-center gap-3 md:gap-6 min-w-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRecurring ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
          <div>
            <span className="font-bold text-white tracking-tight">{service.serviceBase.name}</span>
            {service.serviceBase.description && (
              <div className="text-xs text-[var(--text-muted)] italic">{service.serviceBase.description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase font-bold text-white/50 tracking-tighter">
          {isRecurring ? <Repeat size={10} /> : <Zap size={10} />}
          {service.displayFreq}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-bold text-white font-mono text-sm">${service.price}</span>
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
        <PaidToggle id={isRecurring ? service.paymentId : service.id} type={isRecurring ? 'contract' : 'onetime'} isPaid={service.isPaid} />
        <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm p-1"><Pencil size={12} /></button>
        <DeleteServiceButton id={isRecurring ? service.contractId : service.id} type={isRecurring ? 'contract' : 'onetime'} />
      </div>
    </div>
  );
}
