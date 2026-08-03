import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollText, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';

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
  const isOC = !horse.studbook_registered && horse.studbook_registration_date && horse.studbook_request_status !== 'pending' && horse.studbook_request_status !== 'rejected';
  const isPending = horse.studbook_request_status === 'pending';
  const isRejected = horse.studbook_request_status === 'rejected';
  const isNotRegistered = !isRegistered && !isOC && !isPending;

  const canRegisterStudbook = hasParentage && fatherApproved && hasDnaTest;
  const canRegisterOC = hasParentage;

  const registerMutation = useMutation({
    mutationFn: async (type) => {
      if (!currentUser) throw new Error('Not logged in');
      const fee = type === 'studbook' ? STUDBOOK_FEE : OC_FEE;
      const balance = currentUser.genesis_balance ?? 0;
      if (balance < fee) throw new Error(`Insufficient funds. Cost: ${fee} ₲`);

      // The request is put on hold — the committee rules at the next daily tick (3:30 UTC)
      await base44.entities.Horse.update(horse.id, {
        studbook_request_status: 'pending',
        studbook_request_type: type,
        studbook_registration_date: format(new Date(), 'yyyy-MM-dd'),
      });
      await base44.auth.updateMe({ genesis_balance: balance - fee });
      await base44.entities.Transaction.create({
        user_email: currentUser.email,
        currency: 'genesis',
        amount: -fee,
        balance_after: balance - fee,
        reason: `Studbook request ${type === 'studbook' ? 'full registry' : 'OC'} - ${horse.name}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horse', horse.id] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Request sent! The committee rules at the next day change (3:30 UTC). 📜');
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isOwner) {
    return (
      <Card className="border-0 bg-white/60">
        <CardContent className="p-4 flex items-center gap-3">
          <ScrollText className="w-5 h-5 text-stone-400" />
          <div>
            <p className="text-sm font-semibold text-stone-700">Studbook status</p>
            <p className="text-xs text-stone-500">
              {isRegistered ? 'Registered in studbook' : isOC ? 'Registered as OC' : 'Not registered'}
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
    <Card className={`border-2 ${isRegistered ? 'border-emerald-200 bg-emerald-50/50' : isOC ? 'border-amber-200 bg-amber-50/50' : isPending ? 'border-blue-200 bg-blue-50/50' : isRejected ? 'border-red-200 bg-red-50/50' : 'border-stone-200 bg-white/60'}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-stone-600" />
          <h3 className="font-semibold text-stone-800 text-sm">Studbook Registration</h3>
          {isRegistered && <Badge className="bg-emerald-100 text-emerald-700 border-0">✅ Full Registry</Badge>}
          {isOC && <Badge className="bg-amber-100 text-amber-700 border-0">OC</Badge>}
          {isPending && <Badge className="bg-blue-100 text-blue-700 border-0"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Pending</Badge>}
          {isRejected && <Badge className="bg-red-100 text-red-700 border-0">❌ Rejected</Badge>}
          {isNotRegistered && <Badge variant="outline" className="text-stone-500">Not registered</Badge>}
        </div>

        {(isRegistered || isOC) && horse.studbook_registration_date && (
          <p className="text-xs text-stone-500">
            Registered on {format(new Date(horse.studbook_registration_date), 'd MMMM yyyy', { locale: enGB })}
          </p>
        )}

        {isPending && (
          <p className="text-xs text-blue-600">
            {horse.studbook_request_type === 'studbook' ? 'Full registry' : 'OC'} request under review.
            The committee rules at the next day change (3:30 UTC).
          </p>
        )}

        {isRejected && (
          <div className="space-y-2">
            <p className="text-xs text-red-600 font-semibold">Request rejected on {format(new Date(horse.studbook_registration_date), 'd MMMM yyyy', { locale: enGB })}</p>
            <div className="p-2 rounded-lg bg-red-50 border border-red-100 space-y-1">
              {(horse.studbook_rejection_reasons || []).map((reason, i) => (
                <p key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {reason}
                </p>
              ))}
            </div>
          </div>
        )}

        {isNotRegistered && !isPending && (
          <>
            {isRejected && (
              <p className="text-xs text-stone-500 italic">You can fix the points above and submit a new request.</p>
            )}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                {fatherApproved
                  ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                  : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                <span className={fatherApproved ? 'text-stone-600' : 'text-amber-700'}>
                  Sire {fatherApproved ? 'approved ✅' : 'not approved or unknown'}
                  </span>
                  </div>
                  <div className="flex items-center gap-2">
                  {hasDnaTest
                  ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                  : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  <span className={hasDnaTest ? 'text-stone-600' : 'text-amber-700'}>
                  DNA test {hasDnaTest ? 'done ✅' : 'required for studbook'}
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
                    ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing…</>
                    : <><FileText className="w-3 h-3 mr-1" /> Register in studbook ({STUDBOOK_FEE} ₲)</>}
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
                    ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing…</>
                    : <>Register as OC ({OC_FEE} ₲)</>}
                </Button>
              )}
            </div>

            {!canRegisterStudbook && !canRegisterOC && (
              <p className="text-xs text-stone-400 italic">This horse cannot be registered in the studbook.</p>
              )}
              {canRegisterOC && !canRegisterStudbook && (
              <p className="text-xs text-amber-600">
               As the sire is not approved, this horse can only be registered as OC (Recorded Origins).
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}