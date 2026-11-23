# IPC Column Registry

Live site: **https://crauxzahard.github.io/hplc-column-registry/**  
Preview gallery: **https://crauxzahard.github.io/hplc-column-registry/preview/**

A static HPLC column management site for tracking unactivated stock, column activations, purposes, and change history.

Built with plain HTML, CSS, and JavaScript. No build step. The site is ready to upload directly to GitHub Pages. The interface is an adaptation of the Spectrum UI component language (Card, Button, Status Badge, Data Table tabs, Command Search, Animated Drawer, Animated Switch, Number Ticker, Toast Stack, and Beam Card) to a static stack.

## Features

- Operational dashboard: stock runway, projected stockout, replacement watch, recent activity, and year context.
- Stock runway per column type: current stock, burn rate, months of cover, projected stockout, and last adjustment.
- Ten column types with codes A–J, including product, phase, supplier, and column dimensions.
- Automatic column codes: `B-01/IPC/26`.
- Sequence per type per year, resetting every year.
- Stock decreases automatically when a column is activated.
- One active purpose per column plus a change history.
- Active/Inactive status per column, with filters and status history.
- Lifecycle estimates per column: days in service, expected service life, remaining days, and due/soon status.
- Usage analytics: activation interval, activations per month, service-life baseline, and longest-serving active columns.
- Stock adjustments through a confirmation modal, with required remarks and an adjustment log.
- Searchable purpose picker sorted alphabetically.
- Year, type, purpose, status, life-stage, and free-text filters.
- Sort controls for column types, stock, activations, and history.
- Status filter tabs with active/inactive counts.
- Column detail drawer with purpose, status, lifecycle, specification, and change history.
- History date range, purpose/kind filters, and history CSV export.
- CSV export per year, including dimensions, status, service days, and remaining life.
- JSON backup and restore for all local data.
- Last-saved timestamp in the sidebar.
- Neutral zinc/cobalt visual system with blue-white and blue-black themes.
- Number ticker, animated chart bars with axis and average line, status badges, command search, and animated drawer.
- Local data storage, no backend.
- Responsive layout for desktop, tablet, and mobile.

## Run locally

Do not open `index.html` with `file://` if you want fonts and storage to work normally. Start a static server from this folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Node.js alternative:

```bash
npx serve .
```

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Upload the **contents of this folder** to the repository root:
   - `index.html`
   - `favicon.svg`
   - `.nojekyll`
   - the `assets/` folder
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/ (root)` folder, then click **Save**.
6. Wait for the deployment, then open `https://<username>.github.io/<repo>/`.

No build, database, or 404 rewrite is required because navigation uses hashes (`#/dashboard`, `#/types/B`, and so on).

### Private or organization repositories

GitHub Pages for private repositories depends on the organization's GitHub plan. Make sure the organization allows Pages before using this deployment model for internal lab data.

## Column code rules

Format:

```text
<TYPE CODE>-<SEQUENCE>/IPC/<2-DIGIT YEAR>
```

Example:

```text
B-01/IPC/26
```

- `B` is the column type code. `B` is Licospher CN.
- `01` is the sequence for that type in that year.
- `IPC` is a fixed keyword.
- `26` is the year 2026.

Sequences are calculated separately for each type and each year. Therefore `B-01/IPC/26` and `A-01/IPC/26` can exist at the same time. In 2027, Licospher CN starts again at `B-01/IPC/27`.

## Column dimensions

Dimensions are stored per type and shown on the type cards, stock table, column detail drawer, activation form, search results, and CSV export.

| Code | Product | Length × ID | Particle | Pore |
| --- | --- | --- | --- | --- |
| A | LiChrospher 100 RP-18 | 250 × 4.6 mm | 5 µm | 100 Å |
| B | LiChrospher 100 CN | 250 × 4.6 mm | 5 µm | 100 Å |
| C | µBondapak C18 | 300 × 3.9 mm | 10 µm | 125 Å |
| D | Shodex Silica C18M 4E | 250 × 4.6 mm | 5 µm | 100 Å |
| E | Hypersil CN | 250 × 4.6 mm | 5 µm | 120 Å |
| F | Hypersil ODS | 250 × 4.6 mm | 5 µm | 120 Å |
| G | Acclaim 120 C18 | 250 × 4.6 mm | 5 µm | 120 Å |
| H | Luna C18(2) | 250 × 4.6 mm | 5 µm | 100 Å |
| I | Acclaim PolarAdvantage II (PA2) | 150 × 4.6 mm | 3 µm | 120 Å |
| J | Bondclone C18 | 300 × 3.9 mm | 10 µm | 148 Å |

These are typical manufacturer specifications for the product lines, not a replacement for the label on the physical column. Confirm length, internal diameter, particle size, and pore size before installing a column.

G and I intentionally use different Acclaim models even though the lab names both start with “Acclaim”. G is the classic **Acclaim 120 C18** used for the 4-aminophenol/paracetamol work. I is the polar-embedded **Acclaim PolarAdvantage II (PA2)**, which matches Thermo Scientific multivitamin application work. Confirm the exact part number and dimensions against the physical labels.

Reference product pages:

- LiChrospher 100 RP-18: [Merck/Sigma-Aldrich](https://www.sigmaaldrich.com/US/en/product/mm/150995)
- LiChrospher 100 CN: [LiChroCART 250-4.6](https://uvison.com/chromatography-supplies/lichrospher-hplc-columns/lichrospher-100-cn-125-4-lichrocart-hplc-cartridge-100-a-5-um-4.6-x-250-mm-150636)
- µBondapak C18: [Waters WAT027324](https://www.waters.com/nextgen/us/en/shop/columns/wat027324--bondapak-c18-column-125a-10--m-39-mm-x-300-mm-1-pk.html)
- Shodex Silica C18M 4E: [Shodex F6650041](https://shodex.de/product-page/silica-c18m-4e)
- Hypersil CN: [Thermo Scientific 30805-254630](https://www.thermofisher.com/order/catalog/product/30805-254630)
- Hypersil ODS: [Thermo Scientific 30105-254630](https://www.thermofisher.com/order/catalog/product/30105-254630)
- Acclaim 120 C18: [Thermo Scientific 059149](https://www.thermofisher.com/order/catalog/product/059149)
- Acclaim PolarAdvantage II (PA2): [Thermo Scientific 063191](https://www.thermofisher.com/order/catalog/product/063191)
- Luna C18(2): [Phenomenex 00G-4252-E0](https://www.phenomenex.com/part/00g-4252-e0)
- Bondclone C18: [Phenomenex 00H-2117-C0](https://www.phenomenex.com/part/00h-2117-c0)

## Column status

Every column has one status:

- **Active** — the column is currently in use.
- **Inactive** — the column is worn out, retired, or otherwise no longer in use.

Inactive columns stay in the registry and history. They no longer count toward “Columns in use”, “Active purposes”, or active purpose distribution. Each status change is recorded in the change history with its date and optional note.

The Activations page and each column type page can be filtered by status. Status changes do not change the column code, purpose history, or stock.

## Stock adjustments

The stock page uses a deliberate **Adjust** flow instead of inline plus/minus buttons:

1. Select the column type and click **Adjust**.
2. Choose **Add** or **Reduce**.
3. Enter the quantity and adjustment date.
4. Add a required remark, for example “Borrowed by another division” or “New shipment from supplier”.
5. Save the adjustment.

Each adjustment is recorded in the **Manual stock adjustments** log with date, type, change, before/after stock, and remark. Automatic stock reductions caused by column activation are separate from this manual log.

## Usage metrics

The **Usage** page estimates cadence and column turnover:

- **Activation interval** — days between two consecutive activations of the same column type. Example: `A-01` to `A-02` took 43 days.
- **Activations per month** — activations in the selected year divided by the elapsed months in that year.
- **Service-life baseline** — mean days from activation to retirement across every retired column in the registry. The table also shows per-type measured values with their sample size (`n`).
- **Columns in use** — active columns in the selected year, with inactive columns shown separately.

The per-type table shows these values for each column type. The interval table lists every consecutive activation pair so the cadence can be checked directly.

Lifecycle estimates use a type-specific baseline only when at least two retired columns of that type exist. With fewer samples, the app falls back to the global baseline and labels the estimate as an estimate, not a measurement.

## Backup and restore

The sidebar and the Stock page expose **Backup** and **Restore**:

- **Backup** downloads a JSON file containing stock levels, columns, purposes, statuses, history, and manual stock movements.
- **Restore** replaces the current local data with a valid backup file after confirmation.

Use JSON backup for data safety. CSV exports are for reporting, not for restoring the registry.

## Data and storage

Data is stored in the browser under this key:

```text
ipc-column-registry-v1
```

The stored data includes columns, purposes, status history, stock levels, and manual stock movements.

This means:

- Data is visible only in the same browser and on the same device.
- Data does not sync between users.
- Clearing site data in the browser deletes the application data.
- Use **Reset demo data** in the sidebar to return to the demo dataset. This also resets statuses and manual stock movements.
- Use **Backup** in the sidebar or Stock page for a restorable JSON snapshot. The stock page also shows the last-saved time.
- Use **Export CSV** on the Activations page for reporting. It includes dimensions, status, service days, and remaining life.
- Date inputs follow the browser locale. Values are stored as ISO (`YYYY-MM-DD`).

If shared data between users is needed later, the site can be upgraded with a backend such as Supabase or Firebase without changing the main UI structure.

## Customization

### Column types and purposes

Edit the `TYPES` and `PURPOSES` arrays in `assets/app.js`. Purpose options are sorted alphabetically at runtime.

### Initial demo stock and status history

Edit `SEED_STOCK`, the seed columns, and the `inactiveSeed` entries in `assets/app.js`.

### Colors and themes

Base color tokens live in `assets/app.css`:

- `:root` for the light theme.
- `html[data-theme="dark"]` for the dark theme.

The Spectrum-inspired component layer lives in `assets/spectrum.css`: cards, buttons, status badges, table tabs, command search, drawer, switch, ticker, and toast styling.

The operations layer lives in `assets/operations.css`: dashboard grid, stock runway, lifecycle cells, chart axis, history rows, searchable purpose picker, and responsive table adjustments.

### Fonts

Fonts are self-hosted in `assets/fonts/`:

- Inter 400–700
- JetBrains Mono 400–600

The SIL Open Font License files are included in the same folder.

## File structure

```text
hplc-column-registry/
├── index.html
├── favicon.svg
├── .nojekyll
├── README.md
├── assets/
│   ├── app.css
│   ├── spectrum.css
│   ├── operations.css
│   ├── app.js
│   └── fonts/
└── preview/
    ├── index.html
    └── *.png
```

The `preview/` folder contains the review gallery and screenshots. It is not used by the application and can be deleted before deployment to keep the repository smaller.

## Credits

- Interface language adapted from [Spectrum UI](https://ui.spectrumhq.in) by Arihant Jain. This project uses a static HTML/CSS/JS interpretation of its Card, Button, Status Badge, Data Table, Command Search, Drawer, Switch, Number Ticker, Toast Stack, and Beam Card patterns; it does not bundle the React package.
- Inter and JetBrains Mono are distributed under the SIL Open Font License. License files are in `assets/fonts/`.
