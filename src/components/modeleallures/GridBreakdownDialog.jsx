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

  if (breakdown.type === 'breed_grid') {
    return <BreedGridDialog horse={horse} breakdown={breakdown} onClose={onClose} />;
  }

  return <FCTGridDialog horse={horse} breakdown={breakdown} onClose={onClose} />;
}

// ─── Breed-specific grid (e.g. Selle Français 2023) ───────────────────
function BreedGridDialog({ horse, breakdown, onClose }) {
  const { grid, sections, noteMax, total, qualification } = breakdown;

  const renderCriteria = (criteria) =>
    criteria.map((criterion) => (
      <div
        key={criterion.name}
        className="flex items-center justify-between px-3 py-1 border-b border-stone-100 last:border-0 text-xs"
      >
        <span className="text-stone-500">{criterion.name}</span>
        <span className="font-mono text-stone-700">{criterion.score.toFixed(1)}/{noteMax}</span>
      </div>
    ));

  return (
    <Dialog open={!!horse} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="w-5 h-5 text-blue-700" />
            {grid.title} — {horse.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Total */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100">
            <span className="font-semibold text-stone-700">Overall total</span>
            <div className="flex items-center gap-2">
             <span className="text-xl font-bold text-stone-800">{total.toFixed(1)}/100</span>
             <Badge className={`border-0 ${qualification.badgeClass}`}>
               {qualification.label}
             </Badge>
            </div>
            </div>

            {/* Sections */}
          {sections.map((section) => (
            <div key={section.name}>
              <p className="font-semibold text-stone-700 mb-2 border-b border-stone-200 pb-1">
                {section.name}
              </p>
              <div className="space-y-2">
                {section.categories.map((cat) => (
                  <div key={cat.name} className="rounded-lg border border-stone-200 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-stone-50">
                      <span className="font-medium text-stone-600 text-xs">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-0 bg-stone-100 text-stone-600 text-xs">
                          {Math.round(cat.weight * 100)}%
                        </Badge>
                        <span className="font-mono text-stone-700 text-sm font-semibold">
                          {cat.score.toFixed(1)}/{noteMax}
                        </span>
                      </div>
                    </div>
                    {renderCriteria(cat.criteria)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── FCT generic grid (Camargue-style) ────────────────────────────────
function FCTGridDialog({ horse, breakdown, onClose }) {
  const {
    adult, foal, presentation,
    adultContribution, foalContribution, presentationBonus,
    total,
  } = breakdown;

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
            FCT Grid — {horse.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100">
            <span className="font-semibold text-stone-700">Overall total</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-stone-800">{total.toFixed(1)}/100</span>
              <Badge className={`border-0 ${getQualification(total).badgeClass}`}>
                {getQualification(total).label}
              </Badge>
            </div>
          </div>

          <FCTSection title="Adult grid (A) — 60%" total={adult.total}>
            {renderCriteria(adult.criteria)}
          </FCTSection>

          <FCTSection title="Foal grid (B) — 40%" total={foal.total}>
            {renderCriteria(foal.criteria)}
          </FCTSection>

          <FCTSection title="Presentation score (C)" total={presentation.total} max="/20">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-stone-100">
              <span className="text-stone-600">Horse</span>
              <span className="font-mono text-stone-700">{presentation.cheval.toFixed(1)}/10</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-stone-600">Presenter</span>
              <span className="font-mono text-stone-700">{presentation.presentateur.toFixed(1)}/10</span>
            </div>
          </FCTSection>

          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100 text-xs text-stone-600 space-y-1">
            <div className="flex justify-between"><span>Adult contribution (A × 60%)</span><span className="font-mono">{adultContribution.toFixed(1)}</span></div>
            <div className="flex justify-between"><span>Foal contribution (B × 40%)</span><span className="font-mono">{foalContribution.toFixed(1)}</span></div>
            <div className="flex justify-between"><span>Presentation bonus</span><span className="font-mono">+{presentationBonus.toFixed(1)}</span></div>
            <div className="flex justify-between font-semibold text-stone-700 border-t border-amber-200 pt-1 mt-1"><span>Overall total</span><span className="font-mono">{total.toFixed(1)}/100</span></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FCTSection({ title, total, max = '/100', children }) {
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