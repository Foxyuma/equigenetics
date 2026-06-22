import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isPast, parseISO } from 'date-fns';

/**
 * Traite les enchères terminées : notifie le vendeur et le gagnant,
 * et marque l'enchère comme "ended" pour éviter les doublons.
 */
async function processEndedAuctions(auctions, currentUser, recentMessages, queryClient) {
  if (!currentUser?.email || !auctions.length) return;
  const now = new Date();

  for (const auction of auctions) {
    // Ignorer les enchères déjà terminées/annulées ou non expirées
    if (auction.status !== 'active') continue;
    if (new Date(auction.ends_at) > now) continue;

    const isSeller = auction.seller_email === currentUser.email;
    const isWinner = auction.current_bidder_email === currentUser.email && auction.current_bid > 0;

    if (!isSeller && !isWinner) {
      // Marquer comme terminée même si on n'est pas concerné pour éviter re-traitement
      await base44.entities.Auction.update(auction.id, { status: 'ended' });
      continue;
    }

    const subject = isWinner
      ? `🏆 Enchère remportée : ${auction.horse_name}`
      : `📢 Enchère terminée : ${auction.horse_name}`;

    // Éviter les doublons
    if (recentMessages.some(m => m.subject === subject)) {
      continue;
    }

    const content = isWinner
      ? `Félicitations ! Vous avez remporté l'enchère pour **${auction.horse_name}** avec une mise de **${auction.current_bid} ₲**.\n\nRendez-vous sur le Marché pour récupérer votre nouveau cheval !`
      : `Votre enchère pour **${auction.horse_name}** est terminée.\n\n` +
        (auction.current_bid > 0
          ? `Meilleure offre : **${auction.current_bid} ₲** par **${auction.current_bidder_name || 'un joueur'}**.`
          : `Aucune offre n'a été placée.`);

    await base44.entities.Message.create({
      sender_email: 'system@equigenesis.fr',
      sender_name: 'EquiGenesis',
      recipient_email: currentUser.email,
      recipient_name: currentUser.full_name || 'Joueur',
      subject,
      content,
      is_read: false,
    });

    // Marquer l'enchère comme terminée
    await base44.entities.Auction.update(auction.id, { status: 'ended' });
    queryClient.invalidateQueries({ queryKey: ['auctions'] });
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    queryClient.invalidateQueries({ queryKey: ['messages-nav'] });
  }
}

/**
 * Vérifie les événements du jeu et envoie des messages automatiques :
 * - Naissance d'un poulain (gestation terminée mais statut "pending")
 * - Décès d'un cheval (âge entre 21 et 24 ans)
 * 
 * Ce hook est "fire and forget" : il ne modifie pas les entités,
 * il crée juste des notifications Message. La naissance réelle reste
 * une action manuelle du joueur.
 */
export function useGameNotifications() {
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Récupère tous les BreedingRecord "pending" de l'utilisateur
  const { data: pendingBreedings = [] } = useQuery({
    queryKey: ['breeding-notifications', currentUser?.email],
    queryFn: () => base44.entities.BreedingRecord.filter({ status: 'pending' }, '-created_date', 100),
    enabled: !!currentUser?.email,
    staleTime: 60_000,
  });

  // Récupère les chevaux de l'utilisateur
  const { data: myHorses = [] } = useQuery({
    queryKey: ['horses-notifications', currentUser?.email],
    queryFn: () => base44.entities.Horse.filter({ created_by: currentUser.email }, '-created_date', 200),
    enabled: !!currentUser?.email,
    staleTime: 60_000,
  });

  // Récupère les messages récents pour éviter les doublons
  const { data: recentMessages = [] } = useQuery({
    queryKey: ['messages-notifications', currentUser?.email],
    queryFn: () => base44.entities.Message.filter({ recipient_email: currentUser.email }, '-created_date', 100),
    enabled: !!currentUser?.email,
    staleTime: 60_000,
  });

  // Récupère les enchères pour détecter les ventes terminées
  const { data: auctions = [] } = useQuery({
    queryKey: ['auctions-notifications'],
    queryFn: () => base44.entities.Auction.list('-created_date', 100),
    enabled: !!currentUser?.email,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!currentUser?.email) return;
    if (!pendingBreedings.length && !myHorses.length && !auctions.length) return;

    const sendNotification = async (subject, content, referenceKey) => {
      // Évite les doublons : si un message avec ce sujet existe déjà, on ne renvoie pas
      const alreadySent = recentMessages.some(m => m.subject === subject);
      if (alreadySent) return;

      await base44.entities.Message.create({
        sender_email: 'system@equigenesis.fr',
        sender_name: 'EquiGenesis',
        recipient_email: currentUser.email,
        recipient_name: currentUser.full_name || 'Joueur',
        subject,
        content,
        is_read: false,
      });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
    };

    // ─── Notifications de naissances ──────────────────────────────────────────
    for (const breeding of pendingBreedings) {
      if (!breeding.foal_due_date) continue;
      if (!isPast(parseISO(breeding.foal_due_date))) continue;

      const subject = `🐴 Naissance prête : ${breeding.mother_name} × ${breeding.father_name}`;
      const sexLabel = breeding.foal_sex === 'male' ? 'un poulain ♂' : 'une pouliche ♀';
      const content = `Bonne nouvelle ! La gestation de **${breeding.mother_name}** est terminée.\n\n` +
        `${sexLabel} de robe **${breeding.foal_coat_color || 'inconnue'}**, race **${breeding.foal_breed || 'inconnue'}**, est prêt(e) à naître.\n\n` +
        `Rendez-vous dans la fiche de ${breeding.mother_name} → onglet **Reproduction** pour le faire naître et lui donner un nom !`;

      sendNotification(subject, content, `birth-${breeding.id}`);
    }

    // ─── Notifications de décès ───────────────────────────────────────────────
    for (const horse of myHorses) {
      const age = horse.age || 0;
      if (age < 21 || age > 24) continue;

      // Utilise l'âge comme "cle unique" dans le sujet pour éviter les doublons
      const subject = `💔 ${horse.name} est décédé(e) à l'âge de ${age} ans`;
      const content = `C'est avec tristesse que nous vous annonçons le décès de **${horse.name}**.\n\n` +
        `${horse.sex === 'male' ? 'Il' : 'Elle'} avait **${age} ans** et était un(e) fidèle compagnon de votre écurie.\n\n` +
        `Race : ${horse.breed} · Robe : ${horse.coat_color || 'inconnue'}\n\n` +
        `Son souvenir restera gravé dans l'histoire de votre haras.`;

      sendNotification(subject, content, `death-${horse.id}-${age}`);
    }

    // ─── Notifications d'enchères terminées ────────────────────────────────────
    processEndedAuctions(auctions, currentUser, recentMessages, queryClient);
  }, [currentUser?.email, pendingBreedings.length, myHorses.length, recentMessages.length, auctions.length]);
}