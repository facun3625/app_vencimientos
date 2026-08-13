"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createContractAction, createOneTimeAction } from "./actions";
import { Save, X, Briefcase, DollarSign, Calendar, RefreshCcw, Plus, Trash2, Info, CheckCircle2, FileText, Send } from "lucide-react";
import ClientCombobox from "./ClientCombobox";
import ServiceBaseCombobox from "./ServiceBaseCombobox";

export default function ServiceForm({ type, clients, serviceBases, monthlyCosts = [], defaultClientId, onCancel }: any) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [serviceBaseList, setServiceBaseList] = useState(serviceBases);
  const [rows, setRows] = useState([{ id: Date.now(), serviceBaseId: "", cost: 0, price: 0, notes: "", monthlyCostIds: [] as string[] }]);

  const today = new Date().toISOString().split("T")[0];
  const [frequency, setFrequency] = useState("MONTHLY");
  const [startDate, setStartDate] = useState(today);
  const [isPaid, setIsPaid] = useState(false);
  const [invoiced, setInvoiced] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [currency, setCurrency] = useState("ARS");
  const symbol = currency === "USD" ? "US$" : "$";

  const addRow = () => setRows([...rows, { id: Date.now(), serviceBaseId: "", cost: 0, price: 0, notes: "", monthlyCostIds: [] as string[] }]);
  const removeRow = (id: number) => rows.length > 1 && setRows(rows.filter(r => r.id !== id));

  const updateRow = (id: number, field: string, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const toggleRowMonthlyCost = (id: number, costId: string) => {
    setRows(rows.map(r => {
      if (r.id !== id) return r;
      const has = r.monthlyCostIds.includes(costId);
      return { ...r, monthlyCostIds: has ? r.monthlyCostIds.filter((c: string) => c !== costId) : [...r.monthlyCostIds, costId] };
    }));
  };

  async function handleSubmit(e: any) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!formData.get("clientId")) {
      setError("Seleccioná un cliente de la lista (hacé clic en una opción del buscador)");
      return;
    }

    // Validate rows
    const validServices = rows.filter(r => r.serviceBaseId);
    if (validServices.length === 0) {
      setError("Debes agregar al menos un servicio");
      return;
    }

    formData.set("servicesJson", JSON.stringify(validServices));
    
    startTransition(async () => {
      const res = type === "RECURRING" ? await createContractAction(formData) : await createOneTimeAction(formData);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-5xl mx-auto animate-fade-in">
      {error && <div className="alert alert-error shadow-lg">{error}</div>}

      {/* SECCIÓN 1: DATOS COMUNES */}
      <div className="card !p-5 border-b-4 border-blue-500/30">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Info size={18} className="text-blue-400" /> Datos de la Ficha
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
          <div className="form-group !mb-0">
            <label className="form-label text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Cliente Destino</label>
            <ClientCombobox clients={clients} name="clientId" defaultClientId={defaultClientId} />
          </div>

          <div className="form-group !mb-0">
            <label className="form-label text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Moneda</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/60" size={16} />
              <select
                name="currency"
                className="form-input !pl-10 !py-[0.8rem]"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="ARS">Pesos (ARS)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>
          </div>

          {type === "RECURRING" ? (
            <>
              <div className="form-group !mb-0">
                <label className="form-label text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Frecuencia</label>
                <div className="relative">
                  <RefreshCcw className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/50" size={16} />
                  <select
                    name="frequency"
                    required
                    className="form-input !pl-10 !py-[0.8rem]"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <option value="MONTHLY">Mensual</option>
                    <option value="QUARTERLY">Trimestral</option>
                    <option value="BIANNUAL">Semestral</option>
                    <option value="ANNUAL">Anual</option>
                  </select>
                </div>
              </div>
              <div className="form-group !mb-0">
                <label className="form-label text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Vencimiento de este Período</label>
                <div className="relative cursor-pointer" onClick={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  if (input && 'showPicker' in input) input.showPicker();
                }}>
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/50" size={16} />
                  <input
                    name="startDate"
                    type="date"
                    required
                    className="form-input !pl-10 cursor-pointer"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="form-group !mb-0">
              <label className="form-label text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Fecha Entrega</label>
              <div className="relative cursor-pointer" onClick={(e) => {
                const input = e.currentTarget.querySelector('input');
                if (input && 'showPicker' in input) input.showPicker();
              }}>
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/50" size={16} />
                <input name="deliveryDate" type="date" className="form-input !pl-10 cursor-pointer" />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
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
              {isPaid ? "Ya está pagado / cobrado" : "Todavía pendiente de cobro"}
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
      </div>

      {/* SECCIÓN 2: LISTA DE SERVICIOS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase size={18} className="text-blue-400" /> Servicios a Asignar
          </h2>
          <button type="button" onClick={addRow} className="btn btn-secondary !py-2 !px-4 text-xs">
            <Plus size={14} /> Agregar otro servicio
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <div key={row.id} className="card !p-4 border-l-4 border-white/5 hover:border-blue-500/50 transition-all relative group animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-x-3 gap-y-3 items-end">
                <div className="md:col-span-4 form-group !mb-0">
                  <label className="form-label text-[10px]">Servicio del Catálogo</label>
                  <ServiceBaseCombobox
                    serviceBases={serviceBaseList}
                    value={row.serviceBaseId}
                    onSelect={(id) => updateRow(row.id, "serviceBaseId", id)}
                    onCreated={(item) => setServiceBaseList((prev: any[]) => [...prev, item])}
                    type={type}
                  />
                </div>

                <div className="md:col-span-3 form-group !mb-0">
                  <label className="form-label text-[10px]">Costo (Egresos) · {symbol}</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400/50" size={14} />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={row.cost}
                      onChange={e => updateRow(row.id, "cost", e.target.value)}
                      className="form-input !pl-8 !border-red-500/10 focus:!border-red-500/30"
                    />
                  </div>
                </div>

                <div className="md:col-span-3 form-group !mb-0">
                  <label className="form-label text-[10px]">Precio (Ingresos) · {symbol}</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/50" size={14} />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      required
                      value={row.price}
                      onChange={e => updateRow(row.id, "price", e.target.value)}
                      className="form-input !pl-8 !border-emerald-500/10 focus:!border-emerald-500/30 font-bold text-emerald-400"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className="btn btn-ghost !p-3 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-xl"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="mt-4">
                <input
                  placeholder="Notas adicionales para este servicio específico..."
                  value={row.notes}
                  onChange={e => updateRow(row.id, "notes", e.target.value)}
                  className="bg-transparent border-none text-[11px] text-[var(--text-muted)] w-full outline-none italic hover:text-white transition-colors"
                />
              </div>

              {type === "RECURRING" && monthlyCosts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <label className="form-label text-[10px] mb-2 block">Costos Mensuales Compartidos (suman al costo)</label>
                  <div className="flex flex-wrap gap-3">
                    {monthlyCosts.map((mc: any) => (
                      <label key={mc.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={row.monthlyCostIds.includes(mc.id)}
                          onChange={() => toggleRowMonthlyCost(row.id, mc.id)}
                          className="w-3.5 h-3.5 accent-red-500"
                        />
                        {mc.name} <span className="text-[var(--text-muted)]">(${mc.amount}/mes total)</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-white/5 items-center justify-end">
        <button type="button" onClick={() => (onCancel ? onCancel() : router.back())} className="btn btn-secondary px-8">
          <X size={18} /> Cancelar
        </button>
        <button disabled={isPending} className="btn btn-primary px-10 py-3 shadow-xl shadow-blue-500/20">
          <Save size={18} />
          {isPending ? "Procesando..." : `Asignar ${rows.length} Servicio(s)`}
        </button>
      </div>
    </form>
  );
}
