import React from 'react';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { DISEASES } from '../genetics/GeneticsEngine';

const statusConfig = {
  clear: { label: "Sain", icon: ShieldCheck, color: "bg-emerald-100 text-emerald-700" },
  carrier: { label: "Porteur", icon: ShieldAlert, color: "bg-orange-100 text-orange-700" },
  affected: { label: "Atteint", icon: AlertTriangle, color: "bg-red-100 text-red-700" },
};

export default function HealthPanel({ healthGenes, breed }) {
  const relevantDiseases = DISEASES.filter(d => d.breeds.includes(breed));
  
  return (
    <div className="space-y-2">
      {relevantDiseases.map(disease => {
        const gene = healthGenes?.find(h => h.disease === disease.name);
        const status = gene?.status || "clear";
        const config = statusConfig[status];
        const Icon = config.icon;
        
        return (
          <div key={disease.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-stone-700">{disease.name}</span>
                <span className="text-xs text-stone-400">— {disease.fullName}</span>
              </div>
              <span className="text-xs text-stone-400">Severity: {disease.severity}</span>
            </div>
            <Badge className={`${config.color} border-0 flex items-center gap-1`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </Badge>
          </div>
        );
      })}
      {healthGenes?.filter(h => !relevantDiseases.find(d => d.name === h.disease)).map(gene => {
        const config = statusConfig[gene.status];
        const Icon = config.icon;
        const disease = DISEASES.find(d => d.name === gene.disease);
        return (
          <div key={gene.disease} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-stone-50">
            <div>
              <span className="text-sm font-semibold text-stone-700">{gene.disease}</span>
              {disease && <span className="text-xs text-stone-400 ml-2">— {disease.fullName}</span>}
            </div>
            <Badge className={`${config.color} border-0 flex items-center gap-1`}>
              <Icon className="w-3 h-3" />{config.label}
            </Badge>
          </div>
        );
      })}
      {(!healthGenes || healthGenes.length === 0) && relevantDiseases.length === 0 && (
        <div className="text-center py-6 text-stone-400 text-sm">
          <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
          No known genetic disease for this breed
        </div>
      )}
    </div>
  );
}