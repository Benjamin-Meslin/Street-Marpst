<<<<<<< HEAD
# Carte des tags — Guide complet

Cartographie collaborative des tags street art. Les contributeurs déposent
un blaze, une couleur, une photo et une localisation. Les blazes s'affichent
sur la carte en typographie graffiti. La communauté signale les contenus
problématiques et les tags disparus — tout est géré via une interface admin sécurisée.

---

## Sommaire

1. [Structure du projet](#1-structure-du-projet)
2. [Créer le projet Supabase](#2-créer-le-projet-supabase)
3. [Créer le compte admin](#3-créer-le-compte-admin)
4. [Configurer Cloudinary](#4-configurer-cloudinary)
5. [Remplir config.js](#5-remplir-configjs)
6. [Déployer sur Vercel](#6-déployer-sur-vercel)
7. [Compléter les mentions légales](#7-compléter-les-mentions-légales)
8. [Utiliser l'interface admin](#8-utiliser-linterface-admin)
9. [Système de signalement](#9-système-de-signalement)
10. [Sécurité](#10-sécurité)
11. [Personnalisation](#11-personnalisation)

---

## 1. Structure du projet

```
tags-map/
├── index.html             → carte publique des blazes
├── contribuer.html        → formulaire de contribution publique
├── admin.html             → interface de modération (accès restreint)
├── mentions-legales.html  → mentions légales obligatoires (à compléter)
├── js/
│   └── config.js          → clés API à remplir (voir étape 5)
├── supabase_schema.sql    → schéma base de données à exécuter une fois
└── README.md              → ce fichier
```

### Rôle de chaque fichier

| Fichier | Accès | Rôle |
|---|---|---|
| `index.html` | Public | Carte Leaflet, blazes en typo graffiti, filtres, signalements |
| `contribuer.html` | Public | Formulaire : blaze, couleur, photo, clic sur carte pour localiser |
| `admin.html` | Admin seul | 4 onglets : en attente / illicites / archivés / validés |
| `mentions-legales.html` | Public | Mentions légales LCEN + RGPD (obligatoires) |
| `js/config.js` | — | Clés Supabase et Cloudinary (ne pas commiter avec de vraies clés) |
| `supabase_schema.sql` | — | Tables, trigger automatique, politiques RLS |

---

## 2. Créer le projet Supabase

Supabase héberge la base de données (tags, signalements) et gère
l'authentification de l'admin.

### 2.1 Créer le compte et le projet

1. Va sur https://supabase.com → créer un compte gratuit
2. Clique sur **New project** :
   - Nom : `tags-map`
   - Région : **West EU (Ireland)** ou **Central EU (Frankfurt)**
   - Mot de passe base de données : génère-en un fort et note-le
3. Attends ~2 minutes que le projet s'initialise

### 2.2 Récupérer les clés API

1. Dans ton projet → **Settings** (icône engrenage) → **API**
2. Copie ces deux valeurs :
   - **Project URL** → ex. `https://abcdefghijkl.supabase.co`
   - **anon public** (sous "Project API keys") → chaîne commençant par `eyJ...`
3. Tu les copieras dans `config.js` à l'étape 5

### 2.3 Créer les tables et le trigger

1. Dans ton projet → **SQL Editor** → **New query**
2. Copie-colle l'intégralité du fichier `supabase_schema.sql`
3. Clique sur **Run** (ou Ctrl+Entrée)
4. Vérifie dans **Table Editor** que les tables `tags` et `signalements` sont créées

Ce script met en place :

- **Table `tags`** — blaze, couleur, coordonnées GPS, photo, style, support,
  date, rotation, et quatre champs de statut :
  `validated` (publié), `hidden` (masqué illicite), `archived` (tag disparu),
  plus les compteurs `reports_count` et `disparus_count`
- **Table `signalements`** — liée à `tags` par clé étrangère avec
  suppression en cascade ; champ `type_signal` distingue 'illicite' et 'disparu'
- **Trigger `check_reports_threshold`** — s'exécute à chaque signalement :
  masque le tag si `reports_count >= 3` (illicite),
  archive le tag si `disparus_count >= 5` (disparu)
- **Politiques RLS** — lecture publique des tags validés, insertion publique,
  modification et suppression réservées aux admins authentifiés

---

## 3. Créer le compte admin

Le compte admin permet de te connecter sur `/admin.html`.
Il est géré par Supabase Auth — aucun mot de passe dans le code.

1. Dans ton projet Supabase → **Authentication** → **Users**
2. Clique sur **Add user** → **Create new user** :
   - Email : ton adresse email
   - Password : mot de passe fort (12+ caractères, majuscules, chiffres, symboles)
   - Coche **Auto Confirm User**
3. Clique sur **Create user**

Tu peux créer plusieurs comptes si plusieurs personnes modèrent.

> Ne partage jamais ce mot de passe. Il donne accès à la validation,
> la restauration et la suppression de tous les tags.

---

## 4. Configurer Cloudinary

Cloudinary stocke et optimise les photos des tags (25 Go gratuits,
compression automatique côté serveur).

### 4.1 Créer le compte

1. Va sur https://cloudinary.com → créer un compte gratuit
2. Sur le **Dashboard**, note ton **Cloud name**
   (affiché en haut à gauche, ex. `mon-projet-tags`)

### 4.2 Créer un Upload Preset non signé

L'upload preset permet aux contributeurs d'envoyer des photos directement
depuis leur navigateur sans exposer de clé secrète.

1. **Settings** (icône engrenage) → **Upload** → **Upload presets**
2. Clique sur **Add upload preset** :
   - **Preset name** : `tags_unsigned`
   - **Signing mode** : `Unsigned`
   - **Folder** : `tags`
3. Clique sur **Save**

Les photos sont automatiquement redimensionnées à 1200px max et compressées
(qualité auto, format auto) à chaque upload.

---

## 5. Remplir config.js

Ouvre `js/config.js` et remplace les quatre valeurs placeholder :

```javascript
const CONFIG = {
  // Supabase (étape 2.2)
  SUPABASE_URL: 'https://abcdefghijkl.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsIn...',

  // Cloudinary (étape 4)
  CLOUDINARY_CLOUD_NAME: 'mon-projet-tags',
  CLOUDINARY_UPLOAD_PRESET: 'tags_unsigned',

  // Carte — centre et zoom au chargement
  MAP_CENTER: [45.4397, 4.3872],  // Saint-Étienne par défaut
  MAP_ZOOM: 14,
};
```

Coordonnées utiles pour `MAP_CENTER` :

| Ville | Coordonnées |
|---|---|
| Saint-Étienne | `[45.4397, 4.3872]` |
| Lyon | `[45.7640, 4.8357]` |
| Paris | `[48.8566, 2.3522]` |
| Marseille | `[43.2965, 5.3698]` |
| Bordeaux | `[44.8378, -0.5792]` |

> La clé `anon` est publique par conception — elle ne donne accès
> qu'aux opérations autorisées par les politiques RLS.
> Ne mets jamais la clé `service_role` dans ce fichier.

---

## 6. Déployer sur Vercel

### 6.1 Créer le dépôt GitHub

1. Va sur https://github.com → **New repository** → nom : `tags-map`
2. Depuis le dossier `tags-map/` dans ton terminal :

```bash
git init
git add .
git commit -m "init : carte des tags"
git remote add origin https://github.com/TON-USERNAME/tags-map.git
git push -u origin main
```

### 6.2 Déployer sur Vercel

1. Va sur https://vercel.com → connexion via GitHub
2. **Add New Project** → importe le dépôt `tags-map`
3. Laisse tous les paramètres par défaut → **Deploy**

Ton site est en ligne en ~30 secondes.
URL obtenue : `https://tags-map-xxxx.vercel.app`

### 6.3 Mettre à jour le site

Pour toute modification, il suffit de pousser sur GitHub :

```bash
git add .
git commit -m "description du changement"
git push
```

Vercel redéploie automatiquement en quelques secondes.

---

## 7. Compléter les mentions légales

**Obligatoire avant la mise en ligne.** Ouvre `mentions-legales.html`
et remplace les occurrences de `[TON-EMAIL]` et `[Ton prénom et nom]`
par tes vraies informations.

Ces mentions sont imposées par l'article 6 de la loi LCEN du 21 juin 2004,
même pour un site gratuit et non commercial.

---

## 8. Utiliser l'interface admin

Accède à : `https://ton-site.vercel.app/admin.html`

Connecte-toi avec l'email et le mot de passe créés à l'étape 3.
La session est conservée dans ton navigateur (pas besoin de te reconnecter
à chaque visite).

L'interface est organisée en **4 onglets** :

---

### Onglet 1 — En attente

Tags soumis par les contributeurs, en attente de ta validation.
Pas encore visibles sur la carte publique.

| Action | Effet |
|---|---|
| **✓ Valider** | Le tag apparaît immédiatement sur la carte publique |
| **✕ Supprimer** | Suppression définitive du tag et de ses métadonnées |
| **⌖ Voir** | Ouvre OpenStreetMap à la localisation exacte pour vérifier |

> **Astuce** : si le projet grossit, tu peux passer en publication directe
> sans validation a priori (voir section 11). La communauté devient alors
> ton seul filet via les signalements.

---

### Onglet 2 — Signalements illicites

Tags masqués automatiquement par le trigger après **3 signalements illicites**.
Ils n'apparaissent plus sur la carte publique.
Chaque carte affiche le détail des motifs signalés.

| Action | Effet |
|---|---|
| **↩ Restaurer** | Remet le tag en ligne, remet `reports_count` à 0, supprime les signalements illicites |
| **✕ Supprimer** | Suppression définitive du tag et de tous ses signalements |
| **⌖ Voir** | Vérifie la localisation sur OpenStreetMap |

> **Obligation légale** : les signalements pour contenu illicite, atteinte
> à la vie privée ou propos haineux doivent être traités sous **24 à 48 heures**
> (LCEN art. 6). Les contenus pédopornographiques nécessitent un signalement
> immédiat à l'OCLCTIC.

---

### Onglet 3 — Tags archivés

Tags signalés comme disparus par la communauté.
Après **5 signalements "disparu"**, le trigger passe le tag en `archived = true`.
Il reste visible sur la carte publique mais apparaît **grisé et barré**,
avec un badge "👻 Tag archivé — n'existe plus physiquement".

| Action | Effet |
|---|---|
| **↩ Toujours là** | Remet le tag en ligne normalement, remet `disparus_count` à 0, supprime les signalements disparus |
| **✕ Supprimer** | Suppression définitive si tu confirmes la disparition |
| **⌖ Voir** | Vérifie sur OpenStreetMap si le tag existe encore |

> Les tags archivés restent intentionnellement visibles comme
> **archive mémorielle**. Un tag effacé fait partie de l'histoire du lieu.

---

### Onglet 4 — Validés

Les 50 derniers tags publiés et actifs, pour audit et suppression si nécessaire.

---

## 9. Système de signalement

### Ce que voit le contributeur

Chaque popup sur la carte affiche **deux boutons** :

- **⚑ Problème** — pour signaler un contenu problématique
- **👻 Disparu** — pour signaler que le tag n'existe plus physiquement
  (ce bouton est masqué si le tag est déjà archivé)

Un clic ouvre une modal en deux étapes :
l'étape 1 confirme le type de signalement,
l'étape 2 précise le motif avec un champ libre optionnel.

### Motifs disponibles

**Signalement illicite (⚑ Problème) :**
- Contenu illicite ou choquant
- Atteinte à la vie privée
- Propos haineux ou discriminatoires
- Autre motif

**Signalement disparu (👻 Disparu) :**
- Effacé ou recouvert
- Très dégradé, méconnaissable
- Mur démoli ou transformé
- Autre raison

### Traitement automatique (trigger Supabase)

À chaque nouveau signalement, le trigger `check_reports_threshold` s'exécute :

```
Nouveau signalement
        ↓
type_signal = 'illicite' ?
    → reports_count + 1
    → si reports_count >= 3 : hidden = true (invisible sur la carte)

type_signal = 'disparu' ?
    → disparus_count + 1
    → si disparus_count >= 5 : archived = true (grisé sur la carte)
```

### Modifier les seuils

Les seuils sont définis dans la fonction SQL `check_reports_threshold` :

```sql
-- Seuil masquage illicite (actuellement 3)
update tags set hidden = true
  where id = NEW.tag_id and reports_count >= 3;

-- Seuil archivage disparu (actuellement 5)
update tags set archived = true
  where id = NEW.tag_id and disparus_count >= 5;
```

Pour modifier un seuil après déploiement : Supabase → **SQL Editor** →
relance uniquement le bloc `create or replace function check_reports_threshold()`.

---

## 10. Sécurité

### Tableau des protections

| Action | Mécanisme |
|---|---|
| Lire les tags validés | Public — intentionnel |
| Soumettre un tag | Public — intentionnel |
| Signaler un tag (illicite ou disparu) | Public — intentionnel |
| Lire les tags non validés ou masqués | Supabase Auth (JWT serveur) |
| Lire les signalements | Supabase Auth (JWT serveur) |
| Valider un tag | Supabase Auth (JWT serveur) |
| Restaurer un tag masqué ou archivé | Supabase Auth (JWT serveur) |
| Supprimer un tag | Supabase Auth (JWT serveur) |

La page `admin.html` ne contient aucun mot de passe dans le code source.
L'authentification est entièrement gérée côté serveur par Supabase Auth
via un token JWT signé. Même en lisant le code source, il est impossible
de s'authentifier sans les identifiants du compte admin Supabase.

### Délais légaux de traitement (LCEN)

| Type de contenu | Délai | Action requise |
|---|---|---|
| Pédopornographie | Immédiat | Suppression + signalement OCLCTIC obligatoire |
| Apologie terrorisme, incitation à la haine | 24 heures | Suppression |
| Atteinte à la vie privée, diffamation | 48 heures | Suppression ou masquage |
| Autre contenu signalé | 7 jours ouvrés | Examen + décision |

---

## 11. Personnalisation

### Passer en publication directe (sans validation a priori)

Dans `contribuer.html`, dans la fonction `submitTag()`, remplace :
```javascript
validated: false,
```
par :
```javascript
validated: true,
```
Les tags apparaissent immédiatement sur la carte sans passer par l'onglet
"En attente". La modération repose alors entièrement sur les signalements.

### Changer les typographies des blazes

Dans `index.html`, modifie le tableau `FONTS` :

```javascript
const FONTS = ['Permanent Marker', 'Rubik Dirt', 'Caveat'];
```

Autres Google Fonts au style graffiti qui fonctionnent bien :
`Rock Salt`, `Boogaloo`, `Pacifico`, `Creepster`.

Pour chaque police ajoutée : mets à jour le `<link>` Google Fonts dans `<head>`
ET ajoute le nom dans le tableau `FONTS`.

### Changer le fond de carte

Dans `index.html`, remplace l'URL du tile layer Leaflet :

```javascript
// OpenStreetMap + filtre sombre CSS (défaut)
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

// CartoDB Dark Matter (fond sombre natif, sans filtre CSS)
'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

// Stamen Toner (noir et blanc très contrasté)
'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png'
```

Si tu utilises CartoDB Dark Matter, supprime le CSS `.leaflet-tile { filter: ... }`
dans `index.html` — le fond est déjà sombre nativement.

### Changer le niveau de zoom par défaut

Dans `config.js`, modifie `MAP_ZOOM` :

| Valeur | Vue |
|---|---|
| 12 | Ville entière |
| 14 | Quartiers (défaut) |
| 16 | Rues précises |
| 18 | Bâtiments individuels |

### Modifier le comportement des blazes au zoom

Dans `index.html`, la fonction `blazeSize(zoom)` contrôle la taille
des blazes selon le niveau de zoom de la carte :

```javascript
function blazeSize(zoom) {
  const sizes = { 12:11, 13:13, 14:16, 15:20, 16:26, 17:34, 18:44, 19:56 };
  return sizes[Math.min(Math.max(zoom, 12), 19)] || 16;
}
```

Augmente les valeurs pour des blazes plus grands à tous les niveaux.
=======
# Street-Marpst
This is a map where you can put location of tags with pictures
>>>>>>> 52ef2f9bd27fee8e85fb96ae7221c39e300e09d5
