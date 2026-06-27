import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const DOPING_CHECK_PROBABILITY = {
  novice: 0.05,
  intermediate: 0.10,
  advanced: 0.20,
  elite: 0.35,
  olympic: 0.60,
};

const FINE_AMOUNT = {
  novice: 500,
  intermediate: 1500,
  advanced: 3000,
  elite: 6000,
  olympic: 12000,
};

function getWeekKey() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return `${year}-W${week}`;
}

export default function WeeklyDopingControl() {
  const queryClient = useQueryClient();
  const [ran, setRan] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: registeredCompetitions = [] } = useQuery({
    queryKey: ['doping-check-competitions', user?.email],
    queryFn: () => base44.entities.Competition.filter({ created_by: user.email, status: 'registered' }, '-created_date', 50),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (ran || !user || registeredCompetitions.length === 0) return;
    const weekKey = getWeekKey();
    const lastRun = localStorage.getItem('weekly_doping_control');
    if (lastRun === weekKey) return; // already ran this week
    localStorage.setItem('weekly_doping_control', weekKey);
    setRan(true);
    runControls(weekKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ran, user, registeredCompetitions]);

  const runControls = async (weekKey) => {
    const positives = [];
    const checkedHorses = new Set();

    for (const comp of registeredCompetitions) {
      const prob = DOPING_CHECK_PROBABILITY[comp.level] || 0.10;
      if (Math.random() > prob) continue; // horse not selected for control this week

      const horse = await base44.entities.Horse.filter({ id: comp.horse_id }).then(r => r[0]);
      if (!horse) continue;

      const isDopingRisk = horse.doping_risk_until && new Date(horse.doping_risk_until) > new Date();
      const result = isDopingRisk ? 'positive' : 'negative';
      const fine = isDopingRisk ? (FINE_AMOUNT[comp.level] || 1500) : 0;

      // Record on health record
      const record = await base44.entities.HealthRecord.filter({ horse_id: horse.id }).then(r => r[0]);
      const control = {
        date: new Date().toISOString(),
        competition_name: comp.name,
        level: comp.level,
        result,
        substance: isDopingRisk ? 'Substances interdites détectées' : 'Aucune substance détectée',
        fine_amount: fine,
      };

      if (record) {
        await base44.entities.HealthRecord.update(record.id, {
          doping_controls: [...(record.doping_controls || []), control],
        });
      } else {
        await base44.entities.HealthRecord.create({
          horse_id: horse.id,
          horse_name: horse.name,
          condition: 'good',
          doping_controls: [control],
        });
      }

      if (isDopingRisk) {
        // Create the fine transaction
        const genesis = user.genesis_balance ?? 200000;
        const newBalance = Math.max(0, genesis - fine);
        await base44.auth.updateMe({ genesis_balance: newBalance });
        await base44.entities.Transaction.create({
          user_email: user.email,
          currency: 'genesis',
          amount: -fine,
          balance_after: newBalance,
          reason: 'amende_antidopage',
          reference_id: comp.id,
        });
        // Send bell notification
        await base44.entities.Message.create({
          sender_email: 'system@equigenesis.fr',
          sender_name: 'Fédération Équestre',
          recipient_email: user.email,
          recipient_name: user.full_name || 'Joueur',
          subject: `🚨 Contrôle antidopage positif : ${horse.name}`,
          content: `Le cheval **${horse.name}** a été contrôlé positif lors de l'épreuve **${comp.name}** (niveau ${comp.level}).\n\n` +
            `Substance détectée : ${control.substance}.\n\n` +
            `Sanctions appliquées :\n` +
            `• Disqualification de l'épreuve\n` +
            `• Amende de **${fine.toLocaleString('fr-FR')} ₲**\n` +
            `• Perte de réputation\n\n` +
            `Veillez à respecter les délais d'élimination des substances après tout traitement médical.`,
          is_read: false,
        });
        positives.push({ horseName: horse.name, compName: comp.name, fine });
        checkedHorses.add(horse.id);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['me'] });
    queryClient.invalidateQueries({ queryKey: ['health-record'] });
    queryClient.invalidateQueries({ queryKey: ['health-records'] });
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    queryClient.invalidateQueries({ queryKey: ['messages-nav'] });

    positives.forEach(p => {
      toast.error(
        `🚨 Contrôle antidopage POSITIF pour ${p.horseName} (${p.compName}) — amende de ${p.fine.toLocaleString('fr-FR')} ₲`,
        { duration: 8000 }
      );
    });
  };

  return null;
}