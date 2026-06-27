import React, { useState } from 'react';
import { Book, Clock, Heart, Dna, ShoppingCart, TrendingUp, Trophy, Home, MapPin, AlertTriangle, Star, Calendar, GitBranch, Baby, Activity, Sparkles, Award, Zap } from 'lucide-react';

const sections = [
  {
    id: 'bienvenue',
    icon: Star,
    label: 'Bienvenue',
    color: 'from-amber-500 to-yellow-500',
    content: (
      <div className="space-y-4">
        <p className="text-stone-700 leading-relaxed">
          Bienvenue dans <strong>EquiGenesis</strong>&nbsp;! Tu es a la tete d'un haras et ton objectif est de <strong>selectionner, elever, entrainer</strong> et <strong>faire concourir</strong> les meilleurs chevaux possible.
        </p>
        <p className="text-stone-700 leading-relaxed">
          Chaque cheval est unique, avec son propre <strong>patrimoine genetique</strong>, son <strong>caractere</strong> et son <strong>potentiel</strong>. A toi de faire les bons croisements pour creer la lignee parfaite.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-stone-50 rounded-xl p-3 text-center">
            <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xs font-semibold text-stone-700">Commence avec un cheval</p>
            <p className="text-[10px] text-stone-400">Cree ton premier cheval dans l&apos;ecran d&apos;accueil</p>
          </div>
          <div className="bg-stone-50 rounded-xl p-3 text-center">
            <Heart className="w-5 h-5 text-pink-500 mx-auto mb-1" />
            <p className="text-xs font-semibold text-stone-700">Eleve et progresse</p>
            <p className="text-[10px] text-stone-400">Reproduction, entrainement, concours</p>
          </div>
          <div className="bg-stone-50 rounded-xl p-3 text-center">
            <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs font-semibold text-stone-700">Ameliore tes stats</p>
            <p className="text-[10px] text-stone-400">Entraine-toi et gagne des concours</p>
          </div>
          <div className="bg-stone-50 rounded-xl p-3 text-center">
            <Dna className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-xs font-semibold text-stone-700">Maitrise la genetique</p>
            <p className="text-[10px] text-stone-400">Choisis les bons croisements</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'navigation',
    icon: MapPin,
    label: 'Navigation & Pages',
    color: 'from-stone-600 to-stone-700',
    content: (
      <div className="space-y-4">
        <p className="text-stone-600 text-sm">Le jeu est organise en 4 categories dans le menu du haut&nbsp;:</p>
        <div className="space-y-3">
          <div className="bg-lime-50/60 rounded-xl p-4 border border-lime-200">
            <h4 className="font-bold text-stone-800 flex items-center gap-2 text-sm"><Home className="w-4 h-4 text-lime-600" /> Ecurie</h4>
            <ul className="mt-2 space-y-1.5 text-xs text-stone-600">
              <li><strong>Mes Chevaux</strong> — la liste de tous tes chevaux. Clique sur un cheval pour voir sa fiche detaillee.</li>
              <li><strong>Entrainement</strong> — ameliore les competences de tes chevaux. Chaque seance consomme de l&apos;energie.</li>
              <li><strong>Paddocks</strong> — gere les enclos et le bien-etre de tes chevaux.</li>
              <li><strong>Personnel</strong> — embauche des employes (palefreniers, veterinaires, entraineurs) pour des bonus passifs.</li>
              <li><strong>Clinique Veterinaire</strong> — soigne tes chevaux malades et suis leur sante.</li>
            </ul>
          </div>

          <div className="bg-pink-50/60 rounded-xl p-4 border border-pink-200">
            <h4 className="font-bold text-stone-800 flex items-center gap-2 text-sm"><Heart className="w-4 h-4 text-pink-500" /> Elevage</h4>
            <ul className="mt-2 space-y-1.5 text-xs text-stone-600">
              <li><strong>Reproduction</strong> — choisis un etalon pour saillir ta jument. Voir section dediee ci-dessous.</li>
              <li><strong>Carnet d&apos;elevage</strong> — historique de toutes tes naissances et croisements.</li>
              <li><strong>Lignees &amp; Pedigree</strong> — explore l&apos;arbre genealogique de tes chevaux.</li>
              <li><strong>Marche des Saillies</strong> — consulte les etalons des Haras Nationaux avec leurs niveaux d&apos;approbation.</li>
              <li><strong>Inspection Etalons</strong> — fais inspecter tes males pour obtenir une approbation a la monte.</li>
              <li><strong>Labo Genetique</strong> — teste le genome de tes chevaux (sante, robe, panel complet).</li>
            </ul>
          </div>

          <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200">
            <h4 className="font-bold text-stone-800 flex items-center gap-2 text-sm"><Trophy className="w-4 h-4 text-amber-500" /> Competition</h4>
            <ul className="mt-2 space-y-1.5 text-xs text-stone-600">
              <li><strong>Concours</strong> — inscris tes chevaux dans differentes disciplines (dressage, CSO, cross, etc.).</li>
              <li><strong>Modeles &amp; Allures</strong> — concours de beaute et de conformation, par race.</li>
              <li><strong>Classements</strong> — consulte les meilleurs chevaux et eleveurs.</li>
              <li><strong>Calendrier</strong> — saisons et evenements a venir.</li>
            </ul>
          </div>

          <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200">
            <h4 className="font-bold text-stone-800 flex items-center gap-2 text-sm"><ShoppingCart className="w-4 h-4 text-blue-500" /> Ville</h4>
            <ul className="mt-2 space-y-1.5 text-xs text-stone-600">
              <li><strong>Marche &amp; Encheres</strong> — achete et vends des chevaux aux encheres.</li>
              <li><strong>Boutique</strong> — achete des objets (soins, aliments, medicaments).</li>
              <li><strong>Inventaire</strong> — consulte et utilise tes objets.</li>
              <li><strong>Messages</strong> — recois des notifications et messages des autres joueurs.</li>
              <li><strong>Echanges</strong> — propose des echanges de chevaux avec d&apos;autres joueurs.</li>
              <li><strong>Mon Profil</strong> — gere ton affixe d&apos;elevage, tes preferences.</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'temps',
    icon: Clock,
    label: 'Le Temps dans le Jeu',
    color: 'from-sky-500 to-blue-500',
    content: (
      <div className="space-y-4">
        <p className="text-stone-700 leading-relaxed">
          EquiGenesis a son propre <strong>calendrier</strong> independant du temps reel. Comprendre son fonctionnement est essentiel pour planifier elevage et competitions.
        </p>
        <div className="grid gap-3">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> Le rythme du jeu</h4>
            <ul className="mt-2 space-y-1.5 text-xs text-stone-600">
              <li><strong>1 jour reel = 1 jour de jeu</strong> (synchronise avec l&apos;horloge reelle)</li>
              <li><strong>1 mois de jeu = 14 jours reels</strong> (2 semaines)</li>
              <li><strong>1 annee de jeu = 168 jours reels</strong> (12 mois × 14 jours)</li>
              <li>Un <strong>tick automatique</strong> a lieu chaque jour a <strong>3h30 UTC</strong> (heure serveur) pour faire vieillir les chevaux, avancer les saisons et traiter les concours.</li>
            </ul>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-500" /> Les saisons</h4>
            <p className="mt-1 text-xs text-stone-600">
              Le jeu alterne <strong>printemps</strong>, <strong>ete</strong>, <strong>automne</strong> et <strong>hiver</strong>. Chaque saison dure <strong>3 mois de jeu</strong> (42 jours reels). La saison en cours est affichee dans le header en haut a droite. Certains evenements et concours peuvent varier selon la saison.
            </p>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-amber-500" /> Vieillissement</h4>
            <p className="mt-1 text-xs text-stone-600">
              Les chevaux <strong>vieillissent de 1 an a chaque debut d&apos;annee</strong> de jeu. Ils commencent a <strong>0 an</strong> (poulain) et deviennent adultes visuellement a <strong>3-4 ans</strong>. Un cheval peut vivre jusqu&apos;a environ <strong>30 ans</strong> selon sa sante genetique.
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'genetique',
    icon: Dna,
    label: 'Genetique & Robes',
    color: 'from-purple-500 to-violet-500',
    content: (
      <div className="space-y-4">
        <p className="text-stone-700 leading-relaxed">
          Le c&rsquo;ur d&apos;EquiGenesis, c&apos;est la <strong>genetique</strong>. Chaque cheval possede un genome complet avec des locus qui determinent sa robe, ses motifs et sa sante.
        </p>

        <div className="bg-stone-50 rounded-xl p-4">
          <h4 className="font-bold text-stone-800 text-sm mb-2">Les bases&nbsp;: alleles et dominance</h4>
          <p className="text-xs text-stone-600 leading-relaxed">
            Chaque gene existe en deux copies (alleles), une heritee du pere et une de la mere. Si les deux alleles sont identiques, on parle d&apos;<strong>homozygote</strong> (ex&nbsp;: EE ou ee). S&apos;ils sont differents, c&apos;est un <strong>heterozygote</strong> (ex&nbsp;: Ee).
          </p>
          <p className="text-xs text-stone-600 leading-relaxed mt-2">
            Un allele <strong>dominant</strong> (lettre majuscule, ex&nbsp;: <strong>E</strong>, <strong>A</strong>, <strong>G</strong>) s&apos;exprime meme en un seul exemplaire. Un allele <strong>recessif</strong> (minuscule, ex&nbsp;: <strong>e</strong>, <strong>a</strong>) ne s&apos;exprime que s&apos;il est present en deux copies.
          </p>
          <div className="mt-3 p-3 bg-white rounded-lg border">
            <p className="text-xs font-semibold text-stone-700 mb-1">Exemple — Le gene Extension (controle la couleur de base)&nbsp;:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-stone-50 p-2 rounded"><strong>EE</strong> — Noir (homozygote dominant)</div>
              <div className="bg-stone-50 p-2 rounded"><strong>Ee</strong> — Noir (heterozygote, E domine)</div>
              <div className="bg-stone-50 p-2 rounded"><strong>ee</strong> — Alezan (homozygote recessif)</div>
            </div>
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-4">
          <h4 className="font-bold text-stone-800 text-sm mb-2">Les robes de base</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-amber-100 p-2 rounded flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-800 shrink-0" />
              <span><strong>Bai</strong> — E_ + A_ — Corps brun, crins noirs</span>
            </div>
            <div className="bg-red-100 p-2 rounded flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-700 shrink-0" />
              <span><strong>Alezan</strong> — ee — Corps et crins roux</span>
            </div>
            <div className="bg-stone-800 p-2 rounded flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-stone-900 shrink-0" />
              <span className="text-white"><strong>Noir</strong> — E_ + aa — Corps et crins noirs</span>
            </div>
            <div className="bg-stone-100 p-2 rounded flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-stone-400 shrink-0" />
              <span><strong>Gris</strong> — G_ — Robe qui grisonne avec l&apos;age</span>
            </div>
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-4">
          <h4 className="font-bold text-stone-800 text-sm mb-2">Les dilutions</h4>
          <p className="text-xs text-stone-600 mb-2">Ces genes modifient la couleur de base&nbsp;:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-yellow-50 p-2 rounded"><strong>Creme (Cr)</strong> — Palomino, Isabelle, Cremello</div>
            <div className="bg-amber-50 p-2 rounded"><strong>Dun (D)</strong> — Robe dun, Grullo, marques primitives</div>
            <div className="bg-orange-50 p-2 rounded"><strong>Champagne (CH)</strong> — Reflets dore, yeux ambre</div>
            <div className="bg-blue-50 p-2 rounded"><strong>Silver (Z)</strong> — Eclaircit les crins des noirs et bais</div>
            <div className="bg-green-50 p-2 rounded"><strong>Mushroom (Mu)</strong> — Dilution recessive, alourdit l&apos;alezan</div>
            <div className="bg-pink-50 p-2 rounded"><strong>Perle (prl)</strong> — Dilution forte sur alezan/bai/noir</div>
          </div>
          <p className="text-[10px] text-stone-400 mt-2">Exemple&nbsp;: Alezan (ee) + Creme (Crn) = Palomino. Bai (E_ A_) + Creme (Crn) = Isabelle (Buckskin).</p>
        </div>

        <div className="bg-stone-50 rounded-xl p-4">
          <h4 className="font-bold text-stone-800 text-sm mb-2">Les motifs et patterns blancs</h4>
          <p className="text-xs text-stone-600 mb-2">Ces genes ajoutent du blanc sur la robe, des petites marques aux robes entierement blanches&nbsp;:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2 rounded border"><strong>Tobiano (To)</strong> — Grandes taches blanches rondes, dos traverse</div>
            <div className="bg-white p-2 rounded border"><strong>Sabino (Sb1)</strong> — Balzanes hautes, liste, ventre blanc</div>
            <div className="bg-white p-2 rounded border"><strong>Roan (Rn)</strong> — Poils blancs melanges, robe fleurie</div>
            <div className="bg-white p-2 rounded border"><strong>Dominant White (DW)</strong> — Robe blanche quasi-integrale</div>
            <div className="bg-white p-2 rounded border"><strong>Frame Overo (Fr)</strong> — Taches blanches dentelees sur les flancs</div>
            <div className="bg-white p-2 rounded border"><strong>Splash (Spl)</strong> — Extremites blanches, tache de peinture</div>
            <div className="bg-white p-2 rounded border"><strong>Rabicano (Rb)</strong> — Stries blanches sur les flancs et la queue</div>
            <div className="bg-white p-2 rounded border"><strong>Leopard (Lp)</strong> — Taches sur fond clair (Appaloosa)</div>
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-4">
          <h4 className="font-bold text-stone-800 text-sm mb-2">Les modificateurs</h4>
          <p className="text-xs text-stone-600">
            Des genes qui ajoutent des nuances&nbsp;: <strong>Sooty (So)</strong> — poils noirs dissemines (fonce la robe)&nbsp;;
            <strong>Flaxen (f)</strong> — crins blonds sur alezan&nbsp;;
            <strong>Pangare (P)</strong> — zones eclaircies (ventre, museau)&nbsp;;
            <strong>Bringe (BR1)</strong> — stries verticales (tres rare, moins de 1%).
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'reproduction',
    icon: Heart,
    label: 'Reproduction & Saillies',
    color: 'from-rose-500 to-pink-500',
    content: (
      <div className="space-y-4">
        <p className="text-stone-700 leading-relaxed">
          La reproduction est le pilier du jeu. Voici comment ca fonctionne pas a pas.
        </p>

        <div className="bg-pink-50/80 rounded-xl p-4 border border-pink-200">
          <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2 mb-2"><Heart className="w-4 h-4 text-pink-500" /> Comment faire une saillie</h4>
          <ol className="space-y-2 text-xs text-stone-600 list-decimal list-inside">
            <li>Va dans la fiche d&apos;une <strong>jument (femelle)</strong> de 3 ans ou plus</li>
            <li>Onglet <strong>Reproduction</strong></li>
            <li>Choisis un etalon&nbsp;: <strong>tes propres etalons</strong> (gratuit) ou via le <strong>Marche des Saillies</strong> (payant en Genesis)</li>
            <li>Simule le croisement pour voir les <strong>previsions genetiques</strong></li>
            <li>Confirme la saillie — elle coute <strong>25 d&apos;energie</strong> a la jument</li>
            <li>La naissance a lieu apres <strong>11 mois de jeu</strong> (soit 158 jours reels)</li>
          </ol>
        </div>

        <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200">
          <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2 mb-2"><Award className="w-4 h-4 text-amber-500" /> L&apos;approbation des etalons</h4>
          <p className="text-xs text-stone-600 mb-2">Les etalons doivent etre <strong>inspectes et approuves</strong> pour que leurs poulains soient inscrits au studbook (plein registre). Le niveau d&apos;approbation impacte aussi le <strong>prix de la saillie</strong>&nbsp;:</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="bg-yellow-100 text-yellow-800 p-2 rounded-lg font-medium">Élite — ×2.5</div>
            <div className="bg-green-100 text-green-800 p-2 rounded-lg font-medium">Sport — ×1.8</div>
            <div className="bg-blue-100 text-blue-800 p-2 rounded-lg font-medium">Approuve — ×1.4</div>
            <div className="bg-red-100 text-red-800 p-2 rounded-lg font-medium">Refuse — ×0.7</div>
          </div>
          <p className="text-[10px] text-stone-400 mt-2">Un etalon non approuve produit un poulain OC (Origines Constatees), qui ne peut pas etre inscrit au studbook.</p>
        </div>

        <div className="bg-emerald-50/80 rounded-xl p-4 border border-emerald-200">
          <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2 mb-2"><GitBranch className="w-4 h-4 text-emerald-500" /> Heritage genetique</h4>
          <p className="text-xs text-stone-600 leading-relaxed">
            Le poulain herite <strong>aleatoirement un allele de chaque parent</strong> pour chaque gene. C&apos;est la <strong>loi de Mendel</strong>&nbsp;: 50% du pere, 50% de la mere. Les combinaisons possibles suivent les regles de dominance expliquees plus haut.
          </p>
          <p className="text-xs text-stone-600 leading-relaxed mt-2">
            Les <strong>stats</strong> (vitesse, endurance, agilite, force, temperament, saut, dressage) sont une moyenne des parents avec une variation aleatoire. Le <strong>potentiel genetique</strong> maximum est herite et ne peut pas etre depasse, meme avec l&apos;entrainement.
          </p>
        </div>

        <div className="bg-orange-50/80 rounded-xl p-4 border border-orange-200">
          <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Maladies genetiques et risques</h4>
          <p className="text-xs text-stone-600 leading-relaxed">
            Certaines races sont porteuses de <strong>maladies hereditaires</strong>. Avant d&apos;accoupler deux chevaux, verifie leurs genes de sante via le <strong>Labo Genetique</strong> ou la <strong>fiche du cheval</strong>.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div className="bg-white rounded-lg p-2 border"><strong className="text-red-700">HYPP</strong> — Dominant (Quarter Horse)</div>
            <div className="bg-white rounded-lg p-2 border"><strong className="text-red-700">PSSM1</strong> — Dominant (Warmbloods, QH)</div>
            <div className="bg-white rounded-lg p-2 border"><strong className="text-red-700">HERDA</strong> — Recessif (Quarter Horse)</div>
            <div className="bg-white rounded-lg p-2 border"><strong className="text-red-700">GBED</strong> — Recessif, letal (Quarter Horse)</div>
            <div className="bg-white rounded-lg p-2 border"><strong className="text-red-700">OLWS</strong> — Recessif, letal (Paint Horse)</div>
            <div className="bg-white rounded-lg p-2 border"><strong className="text-red-700">SCID</strong> — Recessif, letal (Arabe)</div>
            <div className="bg-white rounded-lg p-2 border"><strong className="text-red-700">LFS</strong> — Recessif, letal (Arabe)</div>
            <div className="bg-white rounded-lg p-2 border"><strong className="text-red-700">WFFS</strong> — Recessif, letal (Warmbloods)</div>
          </div>
          <p className="text-[10px] text-stone-400 mt-2">Deux parents porteurs d&apos;une maladie recessive letale risquent de produire un poulain mort-ne&nbsp;!</p>
        </div>

        <div className="bg-indigo-50/80 rounded-xl p-4 border border-indigo-200">
          <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2 mb-2"><Book className="w-4 h-4 text-indigo-500" /> Studbook et croisements</h4>
          <p className="text-xs text-stone-600">
            Les <strong>studbooks fermes</strong> (Arabe, Pur-Sang, Friesian, Lipizzaner) n&apos;acceptent que les croisements entre deux parents de la meme race. Les <strong>studbooks ouverts</strong> (Selle Francais, KWPN, etc.) acceptent des croisements avec Pur-Sang, Anglo-Arabe, et d&apos;autres Warmbloods. Les <strong>croisements non reconnus</strong> produisent un poulain <strong>OC</strong> (Origines Constatees).
          </p>
          <div className="mt-2 p-2 bg-white rounded-lg border text-xs">
            <p className="font-semibold text-stone-700 mb-1">Races pures (studbook ferme)&nbsp;:</p>
            <p className="text-stone-500">Arabian, Thoroughbred, Friesian, Lipizzaner</p>
            <p className="font-semibold text-stone-700 mt-2 mb-1">Conseil&nbsp;:</p>
            <p className="text-stone-500">Croiser avec un Pur-Sang (Thoroughbred) est un bon moyen d&apos;ameliorer les performances de n&apos;importe quelle race sportive.</p>
          </div>
        </div>

        <div className="bg-cyan-50/80 rounded-xl p-4 border border-cyan-200">
          <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2 mb-2"><Baby className="w-4 h-4 text-cyan-500" /> La naissance</h4>
          <p className="text-xs text-stone-600">
            Apres 11 mois de gestation, le poulain nait. Tu devras lui donner un nom (avec ou sans affixe d&apos;elevage). Le <strong>sexe</strong>, la <strong>robe exacte</strong> et les <strong>stats</strong> sont une surprise jusqu&apos;a la naissance&nbsp;! Le poulain demarre a 0 an et pourra etre entraine a partir de 3 ans.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'entrainement',
    icon: TrendingUp,
    label: 'Entrainement',
    color: 'from-emerald-500 to-green-500',
    content: (
      <div className="space-y-4">
        <p className="text-stone-700 leading-relaxed">
          L&apos;entrainement ameliore les <strong>competences</strong> de tes chevaux (vitesse, endurance, agilite, force, temperament, saut, dressage). <strong>Attention&nbsp;: les stats ne peuvent pas depasser le potentiel genetique</strong> maximum du cheval.
        </p>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <h4 className="font-bold text-stone-800 text-sm mb-2">Points importants</h4>
          <ul className="space-y-1.5 text-xs text-stone-600">
            <li>Chaque seance d&apos;entrainement consomme de l&apos;<strong>energie</strong> et de l&apos;<strong>energie mentale</strong></li>
            <li>Un cheval fatigue (<strong>energie basse</strong>) a des performances reduites</li>
            <li>L&apos;energie se regenere avec le temps ou avec des <strong>objets</strong> (aliments, supplements)</li>
            <li>Les poulains (<strong>moins de 3 ans</strong>) ont un entrainement special (manipulation, desensibilisation)</li>
            <li>Le <strong>caractere</strong> du cheval influence l&apos;efficacite de l&apos;entrainement</li>
          </ul>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <h4 className="font-bold text-stone-800 text-sm mb-2">Disciplines de concours</h4>
          <p className="text-xs text-stone-600">Chaque discipline sollicite des stats differentes. Par exemple&nbsp;:</p>
          <div className="grid grid-cols-2 gap-1.5 mt-2 text-xs">
            <div className="bg-white p-2 rounded border"><strong>Dressage</strong> — dressage + temperament</div>
            <div className="bg-white p-2 rounded border"><strong>CSO</strong> — saut + agilite + vitesse</div>
            <div className="bg-white p-2 rounded border"><strong>Cross</strong> — endurance + saut + vitesse</div>
            <div className="bg-white p-2 rounded border"><strong>Endurance</strong> — endurance +++</div>
            <div className="bg-white p-2 rounded border"><strong>Barrel Racing</strong> — vitesse + agilite</div>
            <div className="bg-white p-2 rounded border"><strong>Racing</strong> — vitesse + endurance</div>
          </div>
          <p className="text-[10px] text-stone-400 mt-2">Certaines races ont des bonus naturels dans certaines disciplines (ex&nbsp;: Pur-Sang en course, Selle Francais en CSO).</p>
        </div>
      </div>
    )
  },
  {
    id: 'economie',
    icon: ShoppingCart,
    label: 'Economie & Progression',
    color: 'from-yellow-500 to-amber-500',
    content: (
      <div className="space-y-4">
        <p className="text-stone-700 leading-relaxed">
          Le jeu utilise deux monnaies&nbsp;: les <strong>Genesis</strong> (monnaie principale, gagnee en concours et en ventes) et les <strong>Credits</strong> (monnaie premium, pour accelerer certaines actions).
        </p>
        <div className="grid gap-3">
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <h4 className="font-bold text-stone-800 text-sm mb-2">Comment gagner des Genesis</h4>
            <ul className="space-y-1.5 text-xs text-stone-600">
              <li><strong>Concours</strong> — gains selon le niveau et le classement</li>
              <li><strong>Vente de chevaux</strong> — aux encheres ou via le marche</li>
              <li><strong>Naissances</strong> — bonus de reputation</li>
              <li><strong>Evenements</strong> — recompenses saisonnieres</li>
            </ul>
          </div>
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <h4 className="font-bold text-stone-800 text-sm mb-2">La progression</h4>
            <p className="text-xs text-stone-600">
              Ton objectif a long terme est d&apos;ameliorer la <strong>qualite genetique</strong> de ton elevage. Chaque generation doit etre meilleure que la precedente. Commence petit, achete des etalons de qualite au Marche des Saillies, et construis patiemment ta reputation d&apos;eleveur.
            </p>
            <p className="text-xs text-stone-600 mt-2">
              <strong>Conseil debutant</strong>&nbsp;: commence avec une race <strong>warmblood</strong> comme le Selle Francais ou le KWPN qui tolerant les croisements avec Pur-Sang pour ameliorer les performances.
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'conseils',
    icon: Sparkles,
    label: 'Conseils aux Debutants',
    color: 'from-orange-500 to-red-500',
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-200">
          <h4 className="font-bold text-stone-800 text-sm mb-3">Top 10 pour bien demarrer</h4>
          <ol className="space-y-2 text-xs text-stone-600 list-decimal list-inside">
            <li><strong>Cree ton premier cheval</strong> — choisis une race polyvalente (Selle Francais, Quarter Horse, KWPN)</li>
            <li><strong>Entraine-toi</strong> — ameliore les stats de ton cheval de depart</li>
            <li><strong>Participe a des concours</strong> — meme en novice, les gains aident a financer l&apos;elevage</li>
            <li><strong>Achete une jument</strong> — au marche ou aux encheres</li>
            <li><strong>Fais inspecter ton etalon</strong> — l&apos;approbation augmente la valeur des poulains</li>
            <li><strong>Choisis bien tes croisements</strong> — verifie la compatibilite des studbooks</li>
            <li><strong>Teste la genetique</strong> — le labo genetique revele les maladies cachees</li>
            <li><strong>Gere l&apos;energie</strong> — ne surmene pas tes chevaux, utilise des objets de soin</li>
            <li><strong>Embauche du personnel</strong> — palefreniers et entraineurs donnent des bonus passifs</li>
            <li><strong>Patiente</strong> — la gestation dure 11 mois, l&apos;elevage est un investissement long terme&nbsp;!</li>
          </ol>
        </div>

        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <h4 className="font-bold text-stone-800 text-sm mb-2">Erreurs courantes a eviter</h4>
          <ul className="space-y-1.5 text-xs text-stone-600">
            <li><strong>Croiser pere-fille ou mere-fils</strong> — la consanguinite directe n&apos;est pas autorisee</li>
            <li><strong>Accoupler deux porteurs d&apos;une maladie letale</strong> — risque de poulain mort-ne</li>
            <li><strong>Negliger l&apos;energie</strong> — un cheval fatigue performe mal et peut se blesser</li>
            <li><strong>Croiser sans verifier le studbook</strong> — un poulain OC est moins precieux</li>
          </ul>
        </div>
      </div>
    )
  },
];

export default function Guide() {
  const [activeSection, setActiveSection] = useState('bienvenue');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200/50">
          <Book className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-800">Guide du Debutant</h1>
          <p className="text-sm text-stone-500">Tout ce qu&apos;il faut savoir pour bien commencer</p>
        </div>
      </div>

      {/* Navigation par sections */}
      <div className="flex flex-wrap gap-2">
        {sections.map(s => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? `bg-gradient-to-r ${s.color} text-white shadow-lg`
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Contenu de la section active */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
        {sections.find(s => s.id === activeSection)?.content}
      </div>
    </div>
  );
}