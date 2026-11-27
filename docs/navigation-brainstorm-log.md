# Navigation Architecture Brainstorm — Running Log

> A running record of architectural discussions, CMS concepts, trade-offs, and open decisions for redesigning the Sanity navigation content model for **Apex**.
>
> **Related files:**
> - Initial notes: `.playground/brainstorm-ideas.md`
> - Sample hierarchy: `.playground/navigation.yml`
> - Current Sanity schema: `packages/navigation-sanity/src/schemas/navigationMenu.ts`

---

## Session 1 — Core Concepts, Modeling Approaches & Content Reuse

**Date:** 2026-11-26  
**Topics:** Taxonomy / Canonical / Cardinality, Purpose of `menuType`, Approach 1 vs. Approach 2 vs. Hybrid, Handling Shared URLs & Subtrees ("Why Apex")

### 1. Core CMS Concepts (SME & Architect Reference)

#### Taxonomy (Classification vs. Navigation)
- **What it is:** A structured vocabulary used to *classify* content by what it **is** (e.g., Business Line = `Retail`, Product = `IRA`, Audience = `Prospect`, Topic = `Tax Planning`).
- **How it differs from Navigation:**
  - **Taxonomy** answers *"What is this content about?"* — stable, domain-driven, reusable across search, personalization, analytics, and agentic bots.
  - **Navigation** answers *"Where should a user click in this specific UI?"* — changes frequently for marketing, UX, or seasonal needs.
- **Takeaway for Apex:** In `navigation.yml`, levels 1–2 (`apex → retail / advisorServices / wealthManagement / retirementServices / workPlaceServices`) represent **business-line taxonomy**, while deeper levels mix **site hierarchy** and **menu presentation**. Keeping taxonomy as attributes/tags on scoped navigation documents avoids hardcoding the org chart into one monolithic tree.

#### Canonical (Single Source of Truth)
"Canonical" appears in three distinct CMS contexts:
1. **Canonical Locale / Source:** The master version from which translations or regional variants are derived (e.g., `isCanonical: true` for `en-US` sent to Smartling, as already modeled in `navigationMenu.ts`).
2. **Canonical Content Entity:** One authoritative record for a destination/link or shared menu group (e.g., a single `Pledged Asset Line` target) referenced by multiple menus instead of duplicating URLs and metadata.
3. **Canonical URL (SEO):** The single preferred URL for a page so search engines do not treat multiple paths to the same content as duplicates.

#### Cardinality (Relationship Multiplicity)
Cardinality defines *how many* of A relate to *how many* of B, which directly determines whether to use an **embedded object**, a **single reference**, or an **array of references**:
- **1:1** — One `(Org + MenuType + Channel + Locale)` maps to **1** active `navigationMenu` document.
- **1:N** — One `navigationMenu` contains **many** top-level items (e.g., min 1, max 7 for a header).
- **N:M (Many-to-Many)** — One destination URL (e.g., *Why Apex*, *Pledged Asset Line*, *Donor-Advised Funds*) can appear in **many** menus, and one menu contains **many** destinations. **In a CMS, N:M is the clearest signal to use references.**

---

### 2. Purpose of `menuType`

`menuType` (`Global Header`, `Footer`, `Section / Local Nav`, `Utility Bar`, `Contextual / Sidebar`, `Mobile Drawer`) encodes **governance, UI contract, and blast radius** — not just a display label:

| Dimension | Global Header | Footer | Section / Local Nav |
| :--- | :--- | :--- | :--- |
| **Max Depth** | 2–3 levels (mega-menu) | 1–2 levels | 3–5 levels (deep tree like `navigation.yml`) |
| **Owner** | Brand / Digital Experience | Legal / Compliance / Corporate | Business-line / Product teams |
| **Change Cadence** | Low (high scrutiny) | Low (regulatory updates) | High (product launches) |
| **Frontend Slot** | Top bar across the org | Bottom of every page | Left rail / sub-header in a section |

---

### 3. Technical Note on Recursive `NavigationDocument` in Sanity

- In Sanity, you **cannot** embed a `type: 'document'` inline inside an array — arrays of documents must be **`reference`s**.
- You **can** define a recursive `type: 'object'` (e.g., `navItem` with `children: array of navItem`), but deeply nested inline arrays (5–6 levels, 700+ nodes) cause:
  - Modal-stacking fatigue and slower Studio rendering.
  - Fixed-depth GROQ projections (GROQ does not support unbounded recursion).
  - Higher concurrent-editing contention on a single document.

---

### 4. Approach Comparison: Single Tree vs. Scoped Documents

- **Approach 1:** Single monolithic hierarchical document containing all orgs and menus.
- **Approach 2:** Scoped `navigationMenu` documents per `(Org / Business Line × MenuType × Channel × Locale)`.

| Criteria | Approach 1: Single Tree Document | Approach 2: Scoped Documents |
| :--- | :--- | :--- |
| **Authoring UX** | Poor at scale — 700+ nodes in one doc causes deep modal stacking and Studio lag | Clean — editors open only *Retail → Global Header* or *Advisor Services → Footer* |
| **Governance & RBAC** | Risky — Retail editors can accidentally alter or publish Wealth Management nav | Strong — permissions, workflows, and approvals scoped per business line & menu type |
| **Publishing Blast Radius** | High — publishing 1 typo republishes the entire company's navigation | Low — isolated drafts and releases per org/menu |
| **Localization (Smartling)** | Painful — translating one massive doc is slow and costly | Native fit — aligns with existing `channel` + `experience` + `locale` pattern |
| **API Payload & Caching** | Bloated — Retail web downloads Workplace & Advisor nav; any edit busts global cache | Lean — each app fetches only its own menu; granular CDN cache invalidation |
| **Global Overview / Sitemap** | Easy to inspect everything in one document | Achieved via Studio Structure grouping (`Org → MenuType`) or a custom overview query |
| **Cross-Org Reuse** | Still duplicated across branches unless referenced | Duplicated across documents unless backed by references |

**Direction / Recommendation:** **Approach 2** for storage, with **Approach 1** treated as a *read-time projection* (GROQ query or Studio view) when a global overview is needed.

---

### 5. Handling Shared URLs & Subtrees (e.g., "Why Apex")

In `navigation.yml`, two types of reuse appear:
1. **Same URL / Destination, different context:** e.g., `Pledged Asset Line`, `Donor-Advised Funds`, `Direct Indexing` across `retail`, `advisorServices`, and `wealthManagement`.
2. **Same Subtree / Section (shared or partially shared):** e.g., `Why Apex` appears under both `retail` and `advisorServices`.

#### Option A: Without References (Inline Objects Only)
- Every menu owns its own copy of `{ label, href, children }`.
- Updating a URL or retiring a page requires manual edits across every org, menu type, and locale.
- **Showing "where else is this used?" without references:** Requires custom Sanity Studio tooling (a custom Input Component or Inspector Pane that runs a live GROQ query matching `href` or a manual `canonicalKey` across all `navigationMenu` documents) plus a custom migration/function for bulk updates.

#### Option B: Hybrid / Composable Pattern (Recommended)
Combine **Approach 2** scoped menus with lightweight references where reuse matters:
1. **`navigationMenu` (Document — Scoped Container):** `org`, `menuType`, `channel`, `locale`, `isCanonical`, `items[]`.
2. **`navTarget` / `pageLink` (Document — Canonical Destination):** Holds canonical `url`/`slug`, `defaultLabel`, `analyticsId`, `status`. Menus reference it inside an inline wrapper that supports **contextual overrides** (e.g., `labelOverride`). Gives **"Used by" / incoming references** (`*[references($id)]`) and delete-protection out of the box in Sanity Studio.
3. **`navGroup` (Optional Document — Reusable Subtree):** For truly shared blocks (e.g., *Security & Account Protection* or a standard *Compliance Footer Column*) — edit once, reflect everywhere.

---

### Open Questions for Next Discussion

- [x] **Page URL ownership:** Initially in legacy CMS, eventually migrating to Sanity pages. *(Answered in Session 2)*
- [x] **UI depth vs. sitemap depth:** Global Header renders max 3 levels (L1 + 2 more levels); Level 3 acts as the entry point for Section Nav. *(Answered in Session 2)*
- [x] **Team governance & release cadence:** Editorial workflows will be used, with publishing teams potentially separated per domain/business line. *(Answered in Session 2)*

---

## Session 2 — Target Architecture Shaped by Migration, Depth & Governance Constraints

**Date:** 2026-11-26  
**Inputs Confirmed:**
1. **Phased Page Migration:** Pages start in a legacy CMS and will gradually move into Sanity.
2. **UI Depth Boundary:** Global Header shows L1 + max 2 deeper levels (3 levels total); Level 3 is where Section Nav takes over.
3. **Domain-Scoped Workflows:** Editorial workflows and publishing teams may be separate per business line (`retail`, `advisorServices`, `wealthManagement`, `retirementServices`, `workPlaceServices`).

### Architectural Implications & Proposed Target Model

#### 1. The "Strangler Fig" `navTarget` Pattern (Legacy CMS → Sanity Pages)
Because pages will migrate gradually from the legacy CMS into Sanity, introduce a canonical **`navTarget`** document type as an indirection layer between menus and destinations:
- **Phase 1 (Legacy CMS):** `destinationType: 'legacy'` with `legacyUrl` (and optional `legacyId` for traceability).
- **Phase 2 (Sanity Page):** When a page moves to Sanity, flip `destinationType: 'sanityPage'` and attach `internalPage` (`reference` to `page`).
- **GROQ Resolution:** `coalesce(internalPage->slug.current, legacyUrl)` — zero frontend contract change and **zero menu edits** required across headers, footers, section navs, or locales when a page migrates.
- **Built-in "Where is this used?":** Sanity natively tracks incoming references (`*[references($id)]`) to every `navTarget`, giving editors visibility and delete-protection from day 1.

#### 2. Clean Split Between Global Header (L1–L3) and Section Nav (L3+)
Mapping `navigation.yml` directly to this rule:
- **`navigationMenu` (`menuType: 'global'`)** — Strictly capped at **3 levels** (enforced by schema validation):
  - **L1 (Top Bar):** e.g., *Accounts & Products*, *Advice*, *Pricing*, *Why Apex*, *Learn*
  - **L2 (Dropdown Column / Group):** e.g., *Investment Accounts*, *Retirement Accounts*
  - **L3 (Menu Link):** e.g., *Brokerage Account* → references `navTarget` (`Brokerage Account`)
- **`navigationMenu` (`menuType: 'section'`)** — Anchored to a **`rootTarget`** (`reference` to the L3 `navTarget`, e.g., *Brokerage Account*):
  - Holds the deeper section items (L4–L5): e.g., *Open an Individual Brokerage*, *Margin Trading Features*, *Account Funding & Transfers*.
- **Benefits:**
  - Global Header documents stay compact, fast to edit, and fast to cache.
  - Editing a deep section page never triggers a Global Header draft or republish.
  - Because both menus share the same L3 `navTarget` reference, GROQ can still stitch together a full breadcrumb or sitemap on demand.

#### 3. Domain-Scoped Documents + Editorial Workflows
Domain-separated publishing teams make **Approach 2 (Scoped Documents)** a hard requirement:
- Each `navigationMenu` is scoped by `(org / domain × menuType × channel × locale)`.
- Sanity Enterprise RBAC / custom roles and editorial workflows (`Draft → Review → Compliance → Publish`) can be filtered by `org` (e.g., `_type == "navigationMenu" && org == "retail"`).
- **Governance for Shared `navTarget`s:** Tag each `navTarget` with `owningOrg` (or `scope: 'domain' | 'enterprise'`). Domain teams can freely override the *display label* (`labelOverride`) inside their own `navigationMenu`, while changes to a shared canonical URL follow enterprise/owner approval.

### Proposed Document Model (High-Level)

```
navigationMenu (document)          ← Scoped by org × menuType × channel × locale
  ├── org / businessLine           (retail | advisorServices | wealthManagement | retirementServices | workPlaceServices)
  ├── menuType                     (global | section | footer | utility | contextual)
  ├── channel                      (web | mobile | email | agentic)
  ├── locale + isCanonical + smartling
  ├── rootTarget?                  (ref → navTarget; required when menuType == 'section')
  └── items[] (inline navItem)     (strict max depth: 3 for global, 2 for footer, etc.)
        ├── labelOverride?         (optional contextual label for this menu)
        ├── target                 (ref → navTarget, OR inline non-clickable group header)
        └── children[]             (bounded depth based on menuType)

navTarget (document)               ← Canonical destination registry (Strangler Fig layer)
  ├── title                        (default display label)
  ├── owningOrg / scope            (domain | enterprise)
  ├── destinationType              (legacy | sanityPage | external)
  ├── legacyUrl / legacyId         (Phase 1)
  ├── internalPage                 (ref → page, Phase 2)
  ├── externalUrl                  (third-party links)
  └── analyticsId / status
```

---

### Open Questions for Next Discussion

- [x] **Localization of `navTarget` vs. `navigationMenu`:** Non-default locales require localized URL prefixes (e.g., `/es/`, `/zh-hant/`). *(Answered in Session 3)*
- [x] **Shared subtrees (`navGroup`):** No reusable link groups for v1; surface "used elsewhere / similar links" via Studio UX instead. *(Answered in Session 3)*
- [x] **Non-clickable grouping nodes:** Derived from structure — leaf nodes (no `navItems`) are clickable/navigable; branch nodes (with `navItems`) open a dropdown. *(Answered in Session 3)*

---

## Session 3 — Localization URLs, No `navGroup`, and Leaf-vs-Branch Behavior

**Date:** 2026-11-26  
**Inputs Confirmed:**
1. **Localized URLs:** Non-default locales need localized URL prefixes (e.g., `/es/...`, `/zh-hant/...`), while the default locale (`en-US`) has no prefix.
2. **No Reusable Link Groups (`navGroup`):** Keep v1 simpler — no `navGroup` document type; instead, design a way to alert editors when similar/same links are used elsewhere.
3. **Derived Clickability Rule:** If a node has no `navItems`, it is clickable and navigable; if `navItems` exists (non-empty), clicking it opens a dropdown/group.

### Architectural Implications

#### 1. Localized URL Strategy (Without Duplicating `navTarget` Across Locales)
- Keep **`navTarget` as 1 canonical document per destination** (not 6 copies per locale) storing the **locale-agnostic canonical path** (e.g., `/retail/brokerage`).
- **URL Resolution Rule:**
  - Default locale (`en-US`): `/retail/brokerage`
  - Non-default locales (`es`, `zh-Hant`, `zh-Hans`, `en-HK`, `en-SG`): auto-prefix with `/${locale.toLowerCase()}` → `/es/retail/brokerage`, `/zh-hant/retail/brokerage`.
  - **Optional Escape Hatch (`localizedUrlOverrides[]`):** An optional per-locale override array on `navTarget` for legacy CMS pages that have a translated slug (e.g., `/es/cuentas-corretaje`) or region-specific path.
- **Translated Labels:** Continue living on localized `navigationMenu` documents (matching the existing Smartling document-level workflow with `isCanonical` + `smartlingMetadata`).

#### 2. Surfacing "Used Elsewhere / Similar Links" Without `navGroup`
Since there is no `navGroup` document, combine three layers of visibility in Sanity Studio:
1. **Duplicate Prevention on `navTarget`:** Custom validation rule checking uniqueness of `canonicalPath` / `legacyUrl` so editors pick the existing `navTarget` instead of creating duplicates.
2. **Native + Inline "Also Used In" Indicator:** Because every leaf item references a `navTarget`, a lightweight custom Studio Input Component (or Document Inspector Pane) can query `*[_type == "navigationMenu" && references($targetId) && _id != $currentId]` to show a live badge/list: *"Also used in: Advisor Services (Global Header), Retail (Footer)"*.
3. **Section Overlap Detection (Optional Studio Pane):** For branch nodes (e.g., *Why Apex*), a Studio Inspector can compare the set of referenced `navTarget` IDs under that branch against other `navigationMenu` documents and highlight overlap (e.g., *"3 of 4 links here also appear in Advisor Services → Global Header → Why Apex"*).

#### 3. Derived Clickability (Eliminating `isMegaMenu` Drift)
- Remove manual presentation flags like `isMegaMenu` — derive behavior strictly from structure:
  - **Branch (`navItems.length > 0`):** Click opens dropdown/submenu. `target` field is hidden/disallowed; `label` is required.
  - **Leaf (`!navItems || navItems.length === 0`):** Clickable & navigable. `target` (`reference → navTarget`) is **required** (enforced by Sanity validation); `label` defaults to `target.title` unless `labelOverride` is set.
- **Clean Alignment with Level 3 → Section Nav:** In `menuType: 'global'`, L3 items have no `navItems` (because Global Header is capped at 3 levels), so they are automatically **clickable & navigable** — landing the user on the page where `menuType: 'section'` (`rootTarget == that L3 navTarget`) takes over for L4–L5.

---

### Open Questions for Next Discussion

- [x] **Schema shape:** Uniform `navItem` object with depth validation per `menuType`. *(Answered in Session 4)*
- [x] **Scoping dimensions:** `channel` (`web`, `mobile`, `email`, `agentic`) × `experience` (`retail`, `advisorServices`, `wealthManagement`, `retirementServices`, `workPlaceServices`) × `menuType` × `locale`. *(Answered in Session 4)*

---

## Session 4 — Uniform `navItem`, Scoping Dimensions & Draft Schema Blueprint

**Date:** 2026-11-26  
**Inputs Confirmed:**
1. **Uniform `navItem`:** Use a single recursive `navItem` object type across all levels instead of separate `navItemL1` / `navItemL2` / `navItemL3` types.
2. **Channels:** `web`, `mobile`, `email`, `agentic`.
3. **Experiences:** `retail`, `advisorServices`, `wealthManagement`, `retirementServices`, `workPlaceServices` (aligned with `navigation.yml` and existing `experience` field naming in `navigationMenu.ts`).

### Blueprint: Sanity Schema Structure

#### 1. `navTarget` (Document — Canonical Destination Registry)
```ts
// Single source of truth for any navigable destination across all experiences, channels & locales
navTarget (document)
  ├── title: string (required)                    // Canonical/default label (en-US)
  ├── owningExperience: string                    // retail | advisorServices | wealthManagement | retirementServices | workPlaceServices | enterprise
  ├── destinationType: 'legacy' | 'sanityPage' | 'external'
  ├── canonicalPath: string                       // Locale-agnostic path, e.g. "/retail/brokerage" (unique validation; used when destinationType == 'legacy')
  ├── legacyId?: string                           // Optional legacy CMS ID for migration tracking
  ├── internalPage?: reference → page             // Used when destinationType == 'sanityPage' (Phase 2)
  ├── externalUrl?: url                           // Used when destinationType == 'external'
  ├── localizedUrlOverrides?: array<{             // Escape hatch for translated legacy slugs
  │     locale: string,
  │     url: string
  │   }>
  ├── analyticsId?: string
  └── status: 'active' | 'deprecated' | 'redirected'
```

#### 2. `navItem` (Uniform Recursive Object)
```ts
// Uniform item used at every depth; behavior derived from presence of navItems[]
navItem (object)
  ├── label: string                               // Required on branch nodes; optional override on leaf nodes (falls back to target->title)
  ├── target?: reference → navTarget              // REQUIRED when navItems is empty; hidden/disallowed when navItems has items
  ├── badge?: string                              // Optional ("New", "Beta", etc.)
  ├── openInNewTab?: boolean
  ├── promoCard?: navPromoCard                    // Optional (validated/shown only at top-level branch if needed)
  └── navItems?: array<navItem>                   // Presence = click-to-open dropdown; absence = clickable navigable link
```

#### 3. `navigationMenu` (Document — Scoped Container)
```ts
// Scoped by experience × menuType × channel × locale
navigationMenu (document)
  ├── title: string (required)                    // Internal admin title, e.g. "Web | Retail | Global Header | en-US"
  ├── experience: 'retail' | 'advisorServices' | 'wealthManagement' | 'retirementServices' | 'workPlaceServices'
  ├── menuType: 'global' | 'section' | 'footer' | 'utility' | 'contextual'
  ├── channel: 'web' | 'mobile' | 'email' | 'agentic'
  ├── locale: 'en-US' | 'en-HK' | 'en-SG' | 'es' | 'zh-Hant' | 'zh-Hans'
  ├── isCanonical: boolean                        // true for en-US master (Smartling source)
  ├── smartling?: smartlingMetadata
  ├── rootTarget?: reference → navTarget          // REQUIRED when menuType == 'section' (anchors L3 → L4/L5 handoff)
  └── navItems: array<navItem>                    // Max depth enforced via custom validation per menuType (e.g. global <= 3, footer <= 2)
```

### Key Validation & Query Rules
- **Depth Guard per `menuType`:** Custom validation walks `navItems` recursively and enforces max depth (`global`: 3, `footer`: 2, `utility`: 1, `section`: 3).
- **Leaf vs. Branch Guard:**
  - If `navItems?.length > 0` → disallow `target`, require `label`.
  - If `!navItems?.length` → require `target`.
- **Localized URL Resolution (GROQ / Adapter):**
  1. Check `target->localizedUrlOverrides[locale == $locale][0].url`.
  2. Otherwise resolve base path: `coalesce(target->internalPage->slug.current, target->canonicalPath, target->externalUrl)`.
  3. If internal/legacy and `$locale != "en-US"`, prepend `"/" + lower($locale)` (e.g., `/es/retail/brokerage`, `/zh-hant/retail/brokerage`).
- **Studio UX — "Also Used In":** Custom input component on `navItem.target` (or Document Inspector Pane) runs `*[_type == "navigationMenu" && references($targetId) && _id != $currentId]{ _id, title, experience, menuType, channel, locale }` to surface cross-menu usage inline.

---

### Next Steps to Decide
- [ ] **Ready to implement?** Decide whether to prototype these schemas in `packages/navigation-sanity` (alongside updating `packages/navigation-contract` and `scripts/seed-navigation.mjs` from `.playground/navigation.yml`) or refine any edge cases first (e.g., utility links, promo cards, or Studio desk structure grouping).

---

### Decision Log

| # | Decision | Rationale | Date |
| :- | :--- | :--- | :--- |
| D1 | **Scoped `navigationMenu` documents** per `(experience × menuType × channel × locale)` (Approach 2) instead of one monolithic tree | Required for domain-level editorial workflows, RBAC, low publishing blast radius, Smartling localization, and lean API payloads | 2026-11-26 |
| D2 | **Global Header capped at 3 levels (L1–L3); Section Nav handles L3+** | Matches UI rendering contract, keeps Global Header compact/fast, and isolates section updates from global header releases | 2026-11-26 |
| D3 | **Introduce `navTarget` canonical destination layer** (Hybrid pattern) | Enables seamless Legacy CMS → Sanity Page migration without editing menus, eliminates URL duplication, and unlocks native "Used by" tracking | 2026-11-26 |
| D4 | **Locale-agnostic `canonicalPath` on `navTarget` + auto-prefixed localized URLs** (with optional per-locale override) | Avoids duplicating `navTarget` 6× per locale while supporting `/es/`, `/zh-hant/`, etc. and preserving Smartling translation on `navigationMenu` | 2026-11-26 |
| D5 | **No `navGroup` document in v1; use `navTarget` references + Studio "Also Used In" UX** | Keeps content model simpler while still preventing duplicate URLs and surfacing cross-menu usage/overlap to editors | 2026-11-26 |
| D6 | **Derived clickability from `navItems` presence** (leaf = navigable, branch = dropdown) | Eliminates boolean/structure drift (e.g., `isMegaMenu`) and aligns naturally with L3 leaf nodes handing off to Section Nav | 2026-11-26 |
| D7 | **Uniform recursive `navItem` object** instead of `navItemL1`/`L2`/`L3` | Simplifies schema maintenance and GROQ projections; depth limits enforced per `menuType` via validation | 2026-11-26 |
| D8 | **Scoping taxonomy:** `channel` (`web`, `mobile`, `email`, `agentic`) × `experience` (`retail`, `advisorServices`, `wealthManagement`, `retirementServices`, `workPlaceServices`) × `menuType` × `locale` | Consistent with existing `navigationMenu.ts` naming and `navigation.yml` business lines | 2026-11-26 |

