import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { Chips } from '@/components/Chips';
import { Kpi } from '@/components/DashboardUi';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, ErrorState, Field, Loading } from '@/components/ui';
import { useParametres } from '@/hooks/useOuvrir';
import { type Palette, radius, spacing, useColors, useStyles } from '@/theme';
import type { Pagination } from '@/types';

import { adminGet, type BaseApi } from './api';
import type { ChampDef, ContexteListe, Fichier, FiltreDef, IconeChamp } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any -- données des écrans de gestion décrites par la config de chaque module */

// ── Liste générique : recherche, filtres, pagination, tirer-pour-actualiser ──

interface ListeAdminProps {
  titre: string;
  queryKey: unknown[];
  charger: (p: { page: number; recherche: string; filtres: Record<string, string> }) => Promise<any>;
  extraire: (reponse: any) => { items: any[]; pagination: Pagination };
  placeholderRecherche?: string;
  filtres?: FiltreDef[];
  parametresUrl?: { param: string; libelle: string }[];
  entete?: (reponse: any, ctx: ContexteListe) => ReactNode;
  renderItem: (item: any, rafraichir: () => void) => ReactNode;
  action?: { titre: string; onPress: () => void };
  vide: string;
}

export function ListeAdmin({
  titre, queryKey, charger, extraire, placeholderRecherche, filtres = [], parametresUrl = [], entete, renderItem, action, vide,
}: ListeAdminProps) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const definirParametres = useParametres();
  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  // Un filtre peut arriver dans l'adresse (ex. `/paiements?statut=completed` depuis une carte du tableau de bord).
  const parametres = useLocalSearchParams<Record<string, string>>();
  const [valeursFiltres, setValeursFiltres] = useState<Record<string, string>>(
    Object.fromEntries(filtres.map((f) => {
      const demande = parametres[f.param];
      const valide = typeof demande === 'string' && f.options.some((o) => o.value === demande);
      return [f.param, valide ? demande : f.defaut ?? f.options[0].value];
    })),
  );

  // Filtres imposés par l'adresse seule (pas de puce) : affichés dans un bandeau que l'on peut retirer.
  const imposes = parametresUrl.filter((p) => typeof parametres[p.param] === 'string' && parametres[p.param] !== '');
  const valeursImposees = Object.fromEntries(imposes.map((p) => [p.param, parametres[p.param] as string]));
  const tousFiltres = { ...valeursFiltres, ...valeursImposees };

  const requete = useQuery({
    queryKey: [...queryKey, recherche, page, tousFiltres],
    queryFn: () => charger({ page, recherche, filtres: tousFiltres }),
    placeholderData: (precedent) => precedent,
  });

  if (requete.isLoading) return <><Stack.Screen options={{ title: titre }} /><Loading /></>;
  if (requete.error || !requete.data) {
    return (
      <>
        <Stack.Screen options={{ title: titre }} />
        <ErrorState message={getErrorMessage(requete.error)} onRetry={() => void requete.refetch()} />
      </>
    );
  }
  const { items, pagination } = extraire(requete.data);

  return (
    <Screen refreshing={requete.isRefetching} onRefresh={() => void requete.refetch()} fab={action}>
      <Stack.Screen options={{ title: titre }} />
      {entete?.(requete.data, {
        filtres: tousFiltres,
        choisirFiltre: (param, valeur) => { setValeursFiltres((x) => ({ ...x, [param]: valeur })); setPage(1); },
      })}

      {placeholderRecherche !== undefined && (
        <Field
          label="Rechercher"
          icon="search"
          value={saisie}
          onChangeText={setSaisie}
          onSubmitEditing={() => { setRecherche(saisie.trim()); setPage(1); }}
          returnKeyType="search"
          placeholder={placeholderRecherche}
        />
      )}
      {imposes.map((p) => (
        <Pressable key={p.param} style={styles.imposee} onPress={() => { definirParametres({ [p.param]: '' }); setPage(1); }}>
          <Text style={styles.imposeeTexte}>{p.libelle} : {valeursImposees[p.param]}</Text>
          <FontAwesome5 name="times" size={12} color={colors.primaryDark} />
        </Pressable>
      ))}
      {filtres.map((f) => (
        <Chips
          key={f.param}
          options={f.options}
          value={valeursFiltres[f.param]}
          onChange={(v) => { setValeursFiltres((x) => ({ ...x, [f.param]: v })); setPage(1); }}
        />
      ))}

      {items.length === 0 ? (
        <Text style={styles.vide}>{vide}</Text>
      ) : (
        items.map((item) => renderItem(item, () => void requete.refetch()))
      )}

      {pagination.nb_pages > 1 && (
        <View style={styles.pager}>
          <Button title="‹ Précédent" variant="secondary" disabled={!pagination.a_precedent} onPress={() => setPage(page - 1)} style={{ flex: 1 }} />
          <Text style={styles.pageInfo}>{pagination.page} / {pagination.nb_pages}</Text>
          <Button title="Suivant ›" variant="secondary" disabled={!pagination.a_suivant} onPress={() => setPage(page + 1)} style={{ flex: 1 }} />
        </View>
      )}
    </Screen>
  );
}

/** Ligne cliquable d'une liste : titre, sous-titre, pastille optionnelle. */
export function LigneListe({
  titre, sousTitre, badge, onPress, pied,
}: { titre: string; sousTitre?: string; badge?: string | null; onPress?: () => void; pied?: ReactNode }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <Pressable onPress={onPress}>
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.ligne}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.titre} numberOfLines={2}>{titre}</Text>
            {!!sousTitre && <Text style={styles.sous} numberOfLines={2}>{sousTitre}</Text>}
          </View>
          {!!badge && (
            <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
          )}
          {onPress && <FontAwesome5 name="angle-right" size={18} color={colors.textMuted} />}
        </View>
        {pied}
      </Card>
    </Pressable>
  );
}

type IconeFa = React.ComponentProps<typeof FontAwesome5>['name'];
type Teinte = 'primary' | 'info' | 'success' | 'warning' | 'danger';

// Icône et teinte du système choisies d'après le libellé (sans accents, en minuscules) ; le premier motif qui correspond l'emporte.
const ICONES_COMPTEUR: [RegExp, IconeFa, Teinte][] = [
  [/inactif|expire|rejet|annule/, 'times-circle', 'danger'],
  [/attente|demande/, 'hourglass-half', 'warning'],
  [/fin </, 'hourglass-end', 'warning'],
  [/essai/, 'flask', 'warning'],
  [/traite|complete|actif/, 'check-circle', 'success'],
  [/revenu/, 'coins', 'success'],
  [/etudiant/, 'user-graduate', 'info'],
  [/porteur/, 'rocket', 'primary'],
  [/venir/, 'calendar-plus', 'info'],
  [/aujourd/, 'calendar-day', 'success'],
  [/passe/, 'history', 'info'],
  [/semaine/, 'calendar-week', 'success'],
  [/ce mois|renouvel/, 'sync-alt', 'info'],
  [/diffusion/, 'bullhorn', 'primary'],
  [/personnelle/, 'user', 'info'],
  [/progression/, 'chart-line', 'info'],
  [/evenement/, 'calendar-alt', 'primary'],
  [/requete/, 'tasks', 'info'],
  [/reponse/, 'reply', 'success'],
  [/article/, 'newspaper', 'warning'],
  [/projet/, 'rocket', 'primary'],
  [/total/, 'layer-group', 'primary'],
];
const TEINTES: Teinte[] = ['primary', 'info', 'success', 'warning', 'danger'];
// Marques d'accent (U+0300 à U+036F) laissées par la décomposition NFD.
const ACCENTS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');

/**
 * Cartes de chiffres des pages de gestion : même style que celles des accueils (icône colorée, libellé, valeur), deux par
 * ligne. L'icône et la couleur viennent du libellé ; `icone` / `couleur` (une couleur du système) les imposent au besoin.
 */
export function Compteurs({ valeurs }: { valeurs: { label: string; valeur: number | string; couleur?: string; icone?: IconeFa }[] }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const soft = { primary: colors.primarySoft, info: colors.infoSoft, success: colors.successSoft, warning: colors.warningSoft, danger: colors.dangerSoft };
  return (
    <View style={styles.compteurs}>
      {valeurs.map((v, i) => {
        const libelle = v.label.normalize('NFD').replace(ACCENTS, '').toLowerCase();
        const trouve = ICONES_COMPTEUR.find(([motif]) => motif.test(libelle));
        const imposee = v.couleur ? TEINTES.find((t) => colors[t] === v.couleur) : undefined;
        const teinte = imposee ?? trouve?.[2] ?? TEINTES[i % TEINTES.length];
        return (
          <Kpi key={v.label} icone={v.icone ?? trouve?.[1] ?? 'chart-bar'} couleur={colors[teinte]} fond={soft[teinte]}
            label={v.label} valeur={v.valeur} compact />
        );
      })}
    </View>
  );
}

// ── Sélection de choix, d'utilisateurs et de fichiers ────────────────────────

export function ChoixPuces({
  options, valeur, onChoisir, libelles,
}: { options: string[]; valeur: string; onChoisir: (v: string) => void; libelles?: Record<string, string> }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.puces}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChoisir(o)} style={[styles.puce, valeur === o && styles.puceActive]}>
          <Text style={[styles.puceTexte, valeur === o && styles.puceTexteActive]}>{libelles?.[o] ?? o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Choix d'un élément d'une liste du serveur (offre, incubateur...) : la valeur envoyée est son identifiant. */
export function SelecteurReference({
  base, source, cleListe, libelle, valeur, onChange,
}: {
  base: BaseApi; source: string; cleListe: string; libelle: (x: any) => string;
  valeur: string; onChange: (v: string) => void;
}) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'reference', base, source, cleListe],
    queryFn: () => adminGet(source, undefined, base),
  });
  const elements: any[] = data?.[cleListe] ?? [];

  return (
    <View style={{ gap: spacing.sm }}>
      {isLoading && <Text style={styles.sous}>Chargement...</Text>}
      {!!error && <Banner message={getErrorMessage(error)} />}
      {!isLoading && !error && elements.length === 0 && <Text style={styles.sous}>Aucun choix disponible.</Text>}
      {elements.map((x) => {
        const choisi = String(x.id) === String(valeur);
        return (
          <Pressable key={x.id} onPress={() => onChange(choisi ? '' : String(x.id))} style={[styles.choixUtilisateur, choisi && styles.choixActif]}>
            <FontAwesome5 name={choisi ? 'dot-circle' : 'circle'} size={16} color={choisi ? colors.primary : colors.textMuted} />
            <Text style={[styles.titre, { flex: 1 }]}>{libelle(x)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SelecteurUtilisateurs({
  source, valeur, multiple, onChange,
}: { source: string; valeur: number[]; multiple: boolean; onChange: (v: number[]) => void }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const [saisie, setSaisie] = useState('');
  const [q, setQ] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'selecteur', source, q],
    queryFn: () => adminGet(source, { q }),
  });
  // Deux routes, deux formes de réponse : { utilisateurs: [...] } ou { data: [...] }.
  const utilisateurs: { id: number; nom: string; prenom: string }[] = data?.utilisateurs ?? data?.data ?? [];

  function basculer(id: number) {
    if (!multiple) onChange(valeur[0] === id ? [] : [id]);
    else onChange(valeur.includes(id) ? valeur.filter((v) => v !== id) : [...valeur, id]);
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <Field label="" icon="search" value={saisie} onChangeText={setSaisie} onSubmitEditing={() => setQ(saisie.trim())}
        returnKeyType="search" placeholder="Rechercher un utilisateur..." />
      {isLoading && <Text style={styles.sous}>Chargement...</Text>}
      {!!error && <Banner message={getErrorMessage(error)} />}
      {utilisateurs.map((u) => {
        const choisi = valeur.includes(u.id);
        return (
          <Pressable key={u.id} onPress={() => basculer(u.id)} style={[styles.choixUtilisateur, choisi && styles.choixActif]}>
            <FontAwesome5 name={choisi ? (multiple ? 'check-square' : 'dot-circle') : (multiple ? 'square' : 'circle')} size={16}
              color={choisi ? colors.primary : colors.textMuted} />
            <Text style={styles.titre}>{u.prenom} {u.nom}</Text>
          </Pressable>
        );
      })}
      {valeur.length > 0 && <Text style={styles.sous}>{valeur.length} sélectionné(s)</Text>}
    </View>
  );
}

const MIME_DOCUMENTS = [
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg', 'image/png', 'image/gif',
];
const TAILLE_MAX = 10 * 1024 * 1024; // 10 Mo, comme le serveur

export function SelecteurFichiers({
  champ, fichiers, multiple, onChange, onErreur,
}: { champ: string; fichiers: Fichier[]; multiple: boolean; onChange: (f: Fichier[]) => void; onErreur: (m: string) => void }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  async function choisir() {
    const resultat = await DocumentPicker.getDocumentAsync({ type: MIME_DOCUMENTS, multiple, copyToCacheDirectory: true });
    if (resultat.canceled) return;
    const nouveaux: Fichier[] = [];
    for (const f of resultat.assets) {
      if (f.size && f.size > TAILLE_MAX) {
        onErreur(`${f.name} : fichier trop volumineux (10 Mo maximum).`);
        continue;
      }
      nouveaux.push({ champ, uri: f.uri, name: f.name, mimeType: f.mimeType });
    }
    if (nouveaux.length) onChange(multiple ? [...fichiers, ...nouveaux] : nouveaux.slice(0, 1));
  }
  return (
    <View style={{ gap: spacing.sm }}>
      {fichiers.map((f, i) => (
        <View key={`${f.uri}${i}`} style={styles.fichier}>
          <FontAwesome5 name="paperclip" size={14} color={colors.primary} />
          <Text style={[styles.titre, { flex: 1, color: colors.primaryDark }]} numberOfLines={1}>{f.name}</Text>
          <Pressable onPress={() => onChange(fichiers.filter((_, j) => j !== i))} hitSlop={10}>
            <FontAwesome5 name="times" size={16} color={colors.danger} />
          </Pressable>
        </View>
      ))}
      <Button title={multiple ? 'Joindre des fichiers' : 'Joindre un fichier'} icon="paperclip" variant="secondary" onPress={() => void choisir()} />
      <Text style={styles.aide}>PDF, Word, Excel, PowerPoint, JPG, PNG ou GIF — 10 Mo maximum par fichier.</Text>
    </View>
  );
}

// ── Choix d'une couleur ──────────────────────────────────────────────────────

/** Palette proposée pour les couleurs d'un incubateur (la première est la couleur du système). */
export const PALETTE_COULEURS = [
  '#8a3ffc', '#00c2ff', '#4f46e5', '#2563eb', '#14b8a6',
  '#10b981', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#334155',
];

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Pastilles de la palette + code hexadécimal modifiable : la couleur par défaut est déjà choisie, la personne peut en changer. */
function SelecteurCouleur({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const valide = HEX.test(valeur);
  const saisir = (texte: string) => onChange(`#${texte.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)}`);
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.pastilles}>
        {PALETTE_COULEURS.map((c) => {
          const choisie = valeur.toLowerCase() === c;
          return (
            <Pressable key={c} onPress={() => onChange(c)} accessibilityRole="button" accessibilityLabel={`Couleur ${c}`}
              style={[styles.pastille, { backgroundColor: c }, choisie && { borderColor: colors.text }]}>
              {choisie && <FontAwesome5 name="check" size={13} color="#fff" />}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.codeLigne}>
        <View style={[styles.apercu, { backgroundColor: valide ? valeur : colors.border }]} />
        <TextInput value={valeur} onChangeText={saisir} autoCapitalize="none" autoCorrect={false} maxLength={7}
          placeholder="#8a3ffc" placeholderTextColor="#94a3b8" style={styles.codeSaisie} />
      </View>
      <Text style={styles.aide}>{valide ? 'Choisissez une couleur de la palette ou saisissez votre code (#RRGGBB).' : 'Code incomplet : 6 caractères attendus après le #.'}</Text>
    </View>
  );
}

// ── Formulaire générique piloté par une liste de champs ──────────────────────

interface FormulaireProps {
  champs: ChampDef[];
  mode: 'creation' | 'modification';
  valeursInitiales?: Record<string, any>;
  libelle: string;
  /** Espace de l'API des listes de choix (champs « reference »). */
  base?: BaseApi;
  /** Présente le formulaire comme une carte d'identité (photo à gauche, nom, prénom, email et matricule à droite, le reste en dessous). */
  identite?: boolean;
  onSubmit: (valeurs: Record<string, any>, fichiers: Fichier[]) => Promise<void>;
}

/** Icône par défaut d'un champ selon son type quand le module n'en donne pas. */
function iconeChamp(c: ChampDef): IconeChamp {
  if (c.icone) return c.icone;
  switch (c.type) {
    case 'password': return 'lock';
    case 'date': return 'calendar-alt';
    case 'time': return 'clock';
    case 'nombre': return 'hashtag';
    case 'textarea': return 'align-left';
    case 'couleur': return 'palette';
    case 'fichiers': return 'paperclip';
    case 'utilisateur': case 'utilisateurs': return 'user-friends';
    case 'reference': return 'link';
    case 'choix': return 'list-ul';
    default: return 'pen';
  }
}

/** Libellé d'un champ qui n'est pas une saisie de texte, avec son icône (les saisies ont l'icône dans le champ). */
function Etiquette({ texte, icone }: { texte: string; icone: IconeChamp }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  return (
    <View style={styles.etiquette}>
      <FontAwesome5 name={icone} size={13} color={colors.primary} style={{ width: 18, textAlign: 'center' }} />
      <Text style={[styles.label, { marginBottom: 0 }]}>{texte}</Text>
    </View>
  );
}

/** Photo de la personne ; sans photo, silhouette grise comme sur Instagram ou Facebook. */
function PhotoIdentite() {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.photo} accessibilityLabel="Pas de photo">
      <FontAwesome5 name="user" solid size={84} color="#f1f3f6" style={styles.photoSilhouette} />
    </View>
  );
}

/** Champs placés à droite de la photo dans la présentation « carte d'identité ». */
const PRINCIPAUX = ['nom', 'prenom', 'email', 'matricule'];

export function FormulaireAdmin({ champs, mode, valeursInitiales = {}, libelle, base = 'admin', identite, onSubmit }: FormulaireProps) {
  const styles = useStyles(createStyles);
  const visibles = champs.filter((c) => (mode === 'creation' ? !c.modification : !c.creation));
  const [valeurs, setValeurs] = useState<Record<string, any>>(valeursInitiales);
  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const maj = (nom: string) => (v: any) => setValeurs((x) => ({ ...x, [nom]: v }));

  async function valider() {
    const manquants = visibles.filter((c) => c.requis && c.type !== 'fichiers' && !String(valeurs[c.nom] ?? '').trim()
      && !(Array.isArray(valeurs[c.nom]) && valeurs[c.nom].length));
    if (manquants.length) {
      setErreur(`Champ(s) obligatoire(s) : ${manquants.map((c) => c.label).join(', ')}.`);
      return;
    }
    if (visibles.some((c) => c.requis && c.type === 'fichiers') && fichiers.length === 0) {
      setErreur('Joignez le fichier demandé.');
      return;
    }
    setErreur('');
    setEnvoi(true);
    try {
      await onSubmit(valeurs, fichiers);
    } catch (e) {
      setErreur(getErrorMessage(e));
    } finally {
      setEnvoi(false);
    }
  }

  const lignes = visibles.map((c) => {
        const etiquette = c.requis ? `${c.label} *` : c.label;
        if (c.type === 'choix') {
          return (
            <View key={c.nom} style={{ marginBottom: spacing.md }}>
              <Etiquette texte={etiquette} icone={iconeChamp(c)} />
              <ChoixPuces options={c.options ?? []} valeur={String(valeurs[c.nom] ?? '')} onChoisir={maj(c.nom)} libelles={c.libelles} />
            </View>
          );
        }
        if (c.type === 'reference') {
          return (
            <View key={c.nom} style={{ marginBottom: spacing.md }}>
              <Etiquette texte={etiquette} icone={iconeChamp(c)} />
              <SelecteurReference base={base} source={c.source ?? ''} cleListe={c.cleListe ?? ''}
                libelle={c.libelleOption ?? ((x) => String(x.nom))} valeur={String(valeurs[c.nom] ?? '')} onChange={maj(c.nom)} />
            </View>
          );
        }
        if (c.type === 'utilisateur' || c.type === 'utilisateurs') {
          const brut = valeurs[c.nom];
          const ids: number[] = Array.isArray(brut) ? brut.map(Number) : brut ? [Number(brut)] : [];
          return (
            <View key={c.nom} style={{ marginBottom: spacing.md }}>
              <Etiquette texte={etiquette} icone={iconeChamp(c)} />
              <SelecteurUtilisateurs source={c.source ?? ''} valeur={ids} multiple={c.type === 'utilisateurs'}
                onChange={(v) => maj(c.nom)(c.type === 'utilisateurs' ? v : v[0] ?? '')} />
            </View>
          );
        }
        if (c.type === 'couleur') {
          return (
            <View key={c.nom} style={{ marginBottom: spacing.md }}>
              <Etiquette texte={etiquette} icone={iconeChamp(c)} />
              <SelecteurCouleur valeur={String(valeurs[c.nom] ?? '')} onChange={maj(c.nom)} />
            </View>
          );
        }
        if (c.type === 'fichiers') {
          return (
            <View key={c.nom} style={{ marginBottom: spacing.md }}>
              <Etiquette texte={etiquette} icone={iconeChamp(c)} />
              <SelecteurFichiers champ={c.nom} fichiers={fichiers} multiple={!!c.multiple}
                onChange={setFichiers} onErreur={setErreur} />
            </View>
          );
        }
        return (
          <Field
            key={c.nom}
            label={etiquette}
            icon={iconeChamp(c)}
            compact={!!identite && PRINCIPAUX.includes(c.nom)}
            value={String(valeurs[c.nom] ?? '')}
            onChangeText={maj(c.nom)}
            secureTextEntry={c.type === 'password'}
            multiline={c.type === 'textarea'}
            keyboardType={c.type === 'nombre' ? 'numeric' : c.type === 'time' ? 'numbers-and-punctuation' : 'default'}
            autoCapitalize={c.type === 'password' || c.nom === 'email' ? 'none' : 'sentences'}
            placeholder={c.placeholder ?? (c.type === 'date' ? 'AAAA-MM-JJ' : c.type === 'time' ? 'HH:MM' : undefined)}
          />
        );
  });

  return (
    <View style={{ gap: spacing.xs }}>
      {!!erreur && <Banner message={erreur} />}
      {identite ? (
        // Style carte d'identité : photo à gauche, nom, prénom, email et matricule à droite, les autres champs en dessous.
        <Card style={styles.identite}>
          <View style={styles.identiteEntete}>
            <PhotoIdentite />
            <View style={{ flex: 1 }}>{lignes.filter((_, i) => PRINCIPAUX.includes(visibles[i].nom))}</View>
          </View>
          {lignes.filter((_, i) => !PRINCIPAUX.includes(visibles[i].nom))}
        </Card>
      ) : lignes}
      <Button pill title={libelle} onPress={() => void valider()} loading={envoi} />
    </View>
  );
}

// ── Graphiques simples (barres horizontales) ─────────────────────────────────

export function Barres({ donnees, couleur }: { donnees: { label: string; valeur: number }[]; couleur?: string }) {
  const styles = useStyles(createStyles);
  const colors = useColors();
  const remplissage = couleur ?? colors.primary;
  const maxi = Math.max(1, ...donnees.map((d) => d.valeur));
  return (
    <View style={{ gap: spacing.sm }}>
      {donnees.map((d) => (
        <View key={d.label} style={{ gap: 2 }}>
          <View style={styles.barreEntete}>
            <Text style={styles.sous}>{d.label}</Text>
            <Text style={styles.titre}>{d.valeur}</Text>
          </View>
          <View style={styles.barrePiste}>
            <View style={[styles.barre, { width: `${(d.valeur / maxi) * 100}%`, backgroundColor: remplissage }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  vide: { color: colors.textMuted, textAlign: 'center', marginTop: 24, fontSize: 15 },
  pager: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  imposee: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  imposeeTexte: { color: colors.primaryDark, fontSize: 13, fontWeight: '700' },
  pageInfo: { color: colors.textMuted, fontSize: 14 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titre: { fontSize: 15, fontWeight: '600', color: colors.text },
  sous: { fontSize: 13, color: colors.textMuted },
  aide: { fontSize: 12, color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  etiquette: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  identite: { marginBottom: spacing.md },
  identiteEntete: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  photo: { width: 112, height: 134, alignSelf: 'center', borderRadius: 14, backgroundColor: '#cfd4dc', overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  photoSilhouette: { marginBottom: -8 },
  badge: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  compteurs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  puce: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  puceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  puceTexte: { color: colors.text, fontSize: 14 },
  puceTexteActive: { color: '#fff', fontWeight: '600' },
  choixUtilisateur: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  choixActif: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  fichier: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.md },
  barreEntete: { flexDirection: 'row', justifyContent: 'space-between' },
  barrePiste: { height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  barre: { height: 10, borderRadius: 5 },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pastille: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  codeLigne: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  apercu: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  codeSaisie: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 16, color: colors.text, textTransform: 'lowercase' },
});
