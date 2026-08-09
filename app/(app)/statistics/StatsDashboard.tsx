"use client";
import React from "react";
import { 
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RechartsPieChart, Pie, Cell, Legend
} from "recharts";
import { PieChart, BarChart } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#06b6d4", "#8b5cf6", "#f59e0b"];

export default function StatsDashboard({
  pieData,
  barData,
  pieTitle = "Distribución por Servicio",
  pieSubtitle = "Volumen de facturación mensual por categoría",
  pieEmptyText = "No hay servicios activos para graficar",
  barTitle = "Top 5 Clientes",
  barSubtitle = "Clientes con mayor impacto en el MRR",
  barEmptyText = "Sin facturación de clientes este mes",
}: {
  pieData: any[];
  barData: any[];
  pieTitle?: string;
  pieSubtitle?: string;
  pieEmptyText?: string;
  barTitle?: string;
  barSubtitle?: string;
  barEmptyText?: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
      {/* Pie Chart: Distribution by Type */}
      <div className="card !p-8 bg-white/[0.02] border border-white/5 shadow-2xl animate-fade-in">
        <div className="mb-6">
          <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            {pieTitle}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-medium italic opacity-60">{pieSubtitle}</p>
        </div>
        <div className="h-[350px] w-full flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie 
                  data={pieData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={80} 
                  outerRadius={110} 
                  paddingAngle={8}
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <PieChart size={24} className="text-white/20" />
              </div>
              <p className="text-sm text-[var(--text-muted)] font-medium">{pieEmptyText}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bar Chart: Top Clients by Revenue */}
      <div className="card !p-8 bg-white/[0.02] border border-white/5 shadow-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="mb-6">
          <h3 className="text-xl font-black text-white tracking-tight uppercase">{barTitle}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-medium italic opacity-60">{barSubtitle}</p>
        </div>
        <div className="h-[350px] w-full flex items-center justify-center">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={10} tickFormatter={(val) => `$${val}`} axisLine={false} tickLine={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  width={100} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#ffffff03' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#colorRevenue)" 
                  radius={[0, 4, 4, 0]} 
                  barSize={30}
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </RechartsBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <BarChart size={24} className="text-white/20" />
              </div>
              <p className="text-sm text-[var(--text-muted)] font-medium">{barEmptyText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
