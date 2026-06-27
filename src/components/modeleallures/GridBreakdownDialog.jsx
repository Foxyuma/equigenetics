import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClipboardList } from 'lucide-react';
import { getModeleAlluresBreakdown, getQualification } from '@/lib/modeleAllures';

export default function GridBreakdownDialog({ horse, onClose }) {
  if (!horse) return null;
  const breakdown = getModeleAlluresBreakdown(horse);
  if (!breakdown) return null;

  const renderCriteria = (criteria) =>
    Object.entries(criteria).map(([label, score]) => (
      <div key={label} className="flex items-center justify-between px-3 py-1.5 border-b border-stone-100 last:border-0">
        <span className="text-stone-600">{label}</span>
        <span className="font-mono text-stone-700">{score.toFixed(1)}/10</span>
      </div>
    ));

  return (
    <Dialog open={!!horse} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-600" />
            Grille FCT — {horse.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100">
            <span className="font-semibold text-stone-700">Total général</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-stone-800">{breakdown.total.toFixed(1)}/100</span>
              <Badge className={`border-0 ${getQualification(breakdown.total).badgeClass}`}>
                {getQualification(breakdown.total).label}
              </Badge>
            </div>
          </div>

          <GridSection title="Grille adulte (A) — 60%" total={breakdown.adult.total}>
            {renderCriteria(breakdown.adult.criteria)}
          </GridSection>

          <GridSection title="Grille poulain (B) — 40%" total={breakdown.foal.total}>
            {renderCriteria(breakdown.foal.criteria)}
          </GridSection>

          <GridSection title="Note de présentation (C)" total={breakdown.presentation.total} max="/20">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-stone-100">
              <span className="text-stone-600">Cheval</span>
              <span className="font-mono text-stone-700">{breakdown.presentation.cheval.toFixed(1)}/10</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-stone-600">Présentateur</span>
              <span className="font-mono text-stone-700">{breakdown.presentation.presentateur.toFixed(1)}/10</span>
            </div>
          </GridSection>

          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100 text-xs text-stone-600 space-y-1">
            <div className="flex justify-between"><span>Contribution adulte (A × 60%)</span><span className="font-mono">{breakdown.adultContribution.toFixed(1)}</span></div>
            <div className="flex justify-between"><span>Contribution poulain (B × 40%)</span><span className="font-mono">{breakdown.foalContribution.toFixed(1)}</span></div>
            <div className="flex justify-between"><span>Bonus présentation</span><span className="font-mono">+{breakdown.presentationBonus.toFixed(1)}</span></div>
            <div className="flex justify-between font-semibold text-stone-700 border-t border-amber-200 pt-1 mt-1"><span>Total général</span><span className="font-mono">{breakdown.total.toFixed(1)}/100</span></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GridSection({ title, total, max = '/100', children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-stone-700">{title}</p>
        <Badge variant="outline" className="border-0 bg-stone-100 text-stone-600">
          {total.toFixed(1)}{max}
        </Badge>
      </div>
      <div className="rounded-lg border border-stone-200 overflow-hidden">{children}</div>
    </div>
  );
}