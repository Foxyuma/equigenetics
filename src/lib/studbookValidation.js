// Validation des demandes de studbook au tick quotidien
import { base44 } from '@/api/base44Client';
import { determineBreedFromParents } from '@/components/genetics/GeneticsEngine';

const APPROVED_STATUSES = ['approved_for_breeding', 'approved_for_sport_breeding', 'elite_approved'];

/**
 * Vérifie la consanguinité : les parents partagent-ils un ancêtre ?
 * On remonte d'une génération (grands-parents) pour détecter un lien de parenté.
 */
async function checkConsanguinity(horse) {
  const fatherId = horse.father_id;
  const motherId = horse.mother_id;

  if (!fatherId || !motherId) return { ok: true };
  if (fatherId === motherId) return { ok: false, reason: 'Le père et la mère sont le même cheval — consanguinité totale.' };

  // Récupérer les parents
  const [father, mother] = await Promise.all([
    base44.entities.Horse.filter({ id: fatherId }).then(r => r[0]),
    base44.entities.Horse.filter({ id: motherId }).then(r => r[0]),
  ]);

  if (!father || !mother) return { ok: true };

  // Collecter les IDs des grands-parents
  const grandparentIds = [father.father_id, father.mother_id, mother.father_id, mother.mother_id].filter(Boolean);
  const uniqueIds = [...new Set(grandparentIds)];
  if (uniqueIds.length < grandparentIds.length) {
    return { ok: false, reason: 'Consanguinité détectée : le père et la mère partagent au moins un grand-parent commun.' };
  }

  return { ok: true };
}

/**
 * Valide une demande de studbook pour un cheval.
 * Retourne { approved, reasons[] }
 */
export async function validateStudbookRequest(horse) {
  const reasons = [];

  // ─── 1. Races des parents ──────────────────────────────────────────
  const father = horse.father_id ? await base44.entities.Horse.filter({ id: horse.father_id }).then(r => r[0]) : null;
  const mother = horse.mother_id ? await base44.entities.Horse.filter({ id: horse.mother_id }).then(r => r[0]) : null;

  if (!father || !mother) {
    reasons.push('Origines incomplètes : père ou mère non identifié.');
  } else {
    const crossResult = determineBreedFromParents(father.breed, mother.breed, father.breeding_approval_status);
    if (crossResult.isOC) {
      reasons.push(`Croisement non reconnu par le studbook : ${father.breed} × ${mother.breed}. Le poulain ne peut être qu'OC.`);
    }
  }

  // ─── 2. Consanguinité ────────────────────────────────────────────────
  const consangResult = await checkConsanguinity(horse);
  if (!consangResult.ok) {
    reasons.push(consangResult.reason);
  }

  // ─── 3. Aplombs ──────────────────────────────────────────────────────
  const morphology = horse.morphology || [];
  if (morphology.includes('aplombs_defectueux')) {
    reasons.push('Aplombs défectueux détectés — le cheval ne répond pas aux standards morphologiques du studbook.');
  }

  // ─── 4. Gènes visibles (maladies génétiques exprimées) ─────────────
  const affectedGenes = (horse.health_genes || []).filter(g => g.status === 'affected');
  if (affectedGenes.length > 0) {
    const diseaseNames = affectedGenes.map(g => g.disease).join(', ');
    reasons.push(`Maladie(s) génétique(s) exprimée(s) : ${diseaseNames}. Un cheval atteint ne peut être inscrit au studbook.`);
  }

  // Pour le studbook plein registre, le père doit être approuvé
  if (father && !APPROVED_STATUSES.includes(father.breeding_approval_status)) {
    reasons.push("Le père n'est pas approuvé à la monte — inscription au plein registre impossible (OC uniquement possible).");
  }

  return {
    approved: reasons.length === 0,
    reasons,
  };
}

/**
 * Traite toutes les demandes de studbook en attente d'un joueur.
 * Met à jour le statut du cheval et envoie une notification.
 */
export async function processPendingStudbookRequests(userEmail, user) {
  const pendingHorses = await base44.entities.Horse.filter({
    created_by: userEmail,
    studbook_request_status: 'pending',
  }, '-created_date', 50);

  for (const horse of pendingHorses) {
    const requestType = horse.studbook_request_type || 'studbook';
    const result = await validateStudbookRequest(horse);

    if (result.approved) {
      // Approuvé
      await base44.entities.Horse.update(horse.id, {
        studbook_request_status: 'approved',
        studbook_registered: requestType === 'studbook',
        studbook_registration_date: new Date().toISOString().split('T')[0],
        studbook_rejection_reasons: [],
      });

      const statusLabel = requestType === 'studbook' ? 'plein registre' : 'OC (Origines Constatées)';
      await base44.entities.Message.create({
        sender_email: 'system@equigenesis.fr',
        sender_name: 'Commission de Studbook',
        recipient_email: userEmail,
        recipient_name: user?.full_name || 'Éleveur',
        subject: `✅ Studbook validé : ${horse.name}`,
        content: `Votre demande d'inscription au studbook pour **${horse.name}** (${horse.breed}) a été **validée**.\n\n` +
          `Statut : **${statusLabel}**\n\n` +
          `Le cheval est désormais officiellement inscrit. Félicitations !`,
        is_read: false,
      });
    } else {
      // Refusé
      await base44.entities.Horse.update(horse.id, {
        studbook_request_status: 'rejected',
        studbook_rejection_reasons: result.reasons,
      });

      const reasonsList = result.reasons.map(r => `• ${r}`).join('\n');
      await base44.entities.Message.create({
        sender_email: 'system@equigenesis.fr',
        sender_name: 'Commission de Studbook',
        recipient_email: userEmail,
        recipient_name: user?.full_name || 'Éleveur',
        subject: `❌ Studbook refusé : ${horse.name}`,
        content: `Votre demande d'inscription au studbook pour **${horse.name}** (${horse.breed}) a été **refusée**.\n\n` +
          `**Motifs du refus :**\n${reasonsList}\n\n` +
          `Vous pouvez corriger ces points et soumettre une nouvelle demande.`,
        is_read: false,
      });
    }
  }

  return pendingHorses.length;
}