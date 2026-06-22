import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollText, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STUDBOOK_FEE = 1000;
const OC_FEE = 300;

const APPROVED_STATUSES = ['approved_for_breeding', 'approved_for_sport_breeding', 'elite_approved'];

export default function StudbookRegistration({ horse, parents, currentUser }) {
  const queryClient = useQueryClient();
  const isOwner = currentUser && horse.created_by === currentUser.email;

  const { data: geneticTests = [] } = useQuery({
    queryKey: ['genetic-tests-studbook', horse.id],
    queryFn: () => base44.entities.GeneticTest.filter({ horse_id: horse.id }, '-created_date', 10),
    enabled: !!horse.id,
  });

  const hasParentage = horse.father_id || horse.mother_id;
  const fatherApproved = parents?.father && APPROVED_STATUSES.includes(parents.father.breeding_approval_status);
  const hasDnaTest = geneticTests.some(t => t.test_type === 'full_test' || t.test_type === 'health_panel');

  const isRegistered = horse.studbook_registered;
  const isOC = !horse.studbook_registered && horse.studbook_registration_date;
  const isNotRegistered = !horse.studbook_registered && !horse.studbook_registration_date;

  const canRegisterStudbook = hasParentage && fatherApproved && hasDnaTest;
  const canRegisterOC = hasParentage;

  const registerMutation = useMutation({
    mutationFn: async (type) => {
      if (!currentUser) throw new Error('Non connecté');
      const fee = type === 'studbook' ? STUDBOOK_FEE : OC_FEE;
      const balance = currentUser.genesis_balance ?? 0;
      if (balance < fee) throw new Error(`Fonds insuffisants. Coût : ${fee} ₲`);

      const updateData = {
        studbook_registration_date: format(new Date(), 'yyyy-MM-dd'),
      };

      if (type === 'studbook') {
        updateData.studbook_registered = true;
      } else {
        updateData.studbook_registered = false;
      }

      await base44.entities.Horse.update(horse.id, updateData);
      await base44.auth.updateMe({ genesis_balance: balance - fee });
      await base44.entities.Transaction.create({
        user_email: currentUser.email,
        currency: 'genesis',
        amount: -fee,
        balance_after: balance - fee,
        reason: `Inscription studbook ${type === 'studbook' ? 'plein registre' : 'OC'} - ${horse.name}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horse', horse.id] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Demande d\'inscription au studbook acceptée ! 📜');
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isOwner) {
    return (
      <Card className="border-0 bg-white/60">
        <CardContent className="p-4 flex items-center gap-3">
          <ScrollText className="w-5 h-5 text-stone-400" />
          <div>
            <p className="text-sm font-semibold text-stone-700">Statut studbook</p>
            <p className="text-xs text-stone-500">
              {isRegistered ? 'Inscrit au studbook' : isOC ? 'Inscrit comme OC' : 'Non inscrit'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasParentage) {
    return null;
  }

  return (
    <Card className={`border-2 ${isRegistered ? 'border-emerald-200 bg-emerald-50/50' : isOC ? 'border-amber-200 bg-amber-50/50' : 'border-stone-200 bg-white/60'}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-stone-600" />
          <h3 className="font-semibold text-stone-800 text-sm">Inscription au studbook</h3>
          {isRegistered && <Badge className="bg-emerald-100 text-emerald-700 border-0">✅ Plein registre</Badge>}
          {isOC && <Badge className="bg-amber-100 text-amber-700 border-0">OC</Badge>}
          {isNotRegistered && <Badge variant="outline" className="text-stone-500">Non inscrit</Badge>}
        </div>

        {(isRegistered || isOC) && horse.studbook_registration_date && (
          <p className="text-xs text-stone-500">
            Inscrit le {format(new Date(horse.studbook_registration_date), 'd MMMM yyyy', { locale: fr })}
          </p>
        )}

        {isNotRegistered && (
          <>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                {fatherApproved
                  ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                  : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                <span className={fatherApproved ? 'text-stone-600' : 'text-amber-700'}>
                  Père {fatherApproved ? 'approuvé ✅' : 'non approuvé ou inconnu'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasDnaTest
                  ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                  : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                <span className={hasDnaTest ? 'text-stone-600' : 'text-amber-700'}>
                  Test ADN {hasDnaTest ? 'effectué ✅' : 'requis pour le studbook'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {canRegisterStudbook && (
                <Button
                  onClick={() => registerMutation.mutate('studbook')}
                  disabled={registerMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                >
                  {registerMutation.isPending
                    ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />En cours…</>
                    : <><FileText className="w-3 h-3 mr-1" /> Inscrire au studbook ({STUDBOOK_FEE} ₲)</>}
                </Button>
              )}
              {canRegisterOC && (
                <Button
                  onClick={() => registerMutation.mutate('oc')}
                  disabled={registerMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  {registerMutation.isPending
                    ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />En cours…</>
                    : <>Inscrire comme OC ({OC_FEE} ₲)</>}
                </Button>
              )}
            </div>

            {!canRegisterStudbook && !canRegisterOC && (
              <p className="text-xs text-stone-400 italic">Ce cheval ne peut pas être inscrit au studbook.</p>
            )}
            {canRegisterOC && !canRegisterStudbook && (
              <p className="text-xs text-amber-600">
                Le père n'étant pas approuvé, ce cheval ne peut être inscrit qu'en OC (Origines Constatées).
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}