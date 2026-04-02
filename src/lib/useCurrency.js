import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function useCurrency() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const genesis = user?.genesis_balance ?? 300000;
  const credits = user?.credits_balance ?? 10;

  const _record = async (currency, amount, reason, referenceId) => {
    const currentBalance = currency === 'genesis' ? genesis : credits;
    await base44.entities.Transaction.create({
      user_email: user.email,
      currency,
      amount,
      balance_after: currentBalance + amount,
      reason,
      reference_id: referenceId || null,
    });
  };

  const _refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  const addGenesis = async (amount, reason = 'gain', referenceId) => {
    if (!user || amount <= 0) return false;
    await base44.auth.updateMe({ genesis_balance: genesis + amount });
    await _record('genesis', amount, reason, referenceId);
    _refresh();
    return true;
  };

  const spendGenesis = async (amount, reason = 'dépense', referenceId) => {
    if (!user || amount <= 0) return false;
    if (genesis < amount) {
      toast.error(`Genesis insuffisants — il vous faut ${amount.toLocaleString('fr-FR')} ₲`);
      return false;
    }
    await base44.auth.updateMe({ genesis_balance: genesis - amount });
    await _record('genesis', -amount, reason, referenceId);
    _refresh();
    return true;
  };

  const addCredits = async (amount, reason = 'achat', referenceId) => {
    if (!user || amount <= 0) return false;
    await base44.auth.updateMe({ credits_balance: credits + amount });
    await _record('credits', amount, reason, referenceId);
    _refresh();
    return true;
  };

  const spendCredits = async (amount, reason = 'dépense', referenceId) => {
    if (!user || amount <= 0) return false;
    if (credits < amount) {
      toast.error(`Crédits insuffisants — il vous faut ${amount} ✦`);
      return false;
    }
    await base44.auth.updateMe({ credits_balance: credits - amount });
    await _record('credits', -amount, reason, referenceId);
    _refresh();
    return true;
  };

  return { genesis, credits, addGenesis, spendGenesis, addCredits, spendCredits, user };
}