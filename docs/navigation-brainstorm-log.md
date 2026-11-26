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

- [ ] **Page URL ownership:** Do the destination pages live in Sanity (so nav items can reference `page` documents directly), or in an external CMS/app (requiring a `navTarget` registry document in Sanity)?
- [ ] **UI depth vs. sitemap depth:** Does the Global Header only render 2–3 levels while the 5-level hierarchy in `navigation.yml` represents a full sitemap / local section navigation?
- [ ] **Team governance & release cadence:** Are `retail`, `advisorServices`, `wealthManagement`, `retirementServices`, and `workPlaceServices` managed by separate teams with independent publishing approvals?

---

### Decision Log

*(Decisions will be recorded here as we finalize them.)*
