# IPC Column Registry

A static HPLC column management site for tracking unactivated stock, column activations, purposes, and change history.

Built with plain HTML, CSS, and JavaScript. No build step. The site is ready to upload directly to GitHub Pages. The interface is an adaptation of the Spectrum UI component language (Card, Button, Status Badge, Data Table tabs, Command Search, Animated Drawer, Animated Switch, Number Ticker, Toast Stack, and Beam Card) to a static stack.

## Features

- Stock overview per column type and activations for the selected year.
- Ten column types with codes A–J.
- Automatic column codes: `B-01/IPC/26`.
- Sequence per type per year, resetting every year.
- Stock decreases automatically when a column is activated.
- One active purpose per column plus a change history.
- Active/Inactive status per column, with filters and status history.
- Usage analytics: activation interval, activations per month, and average service life.
- Stock adjustments through a confirmation modal, with required remarks and an adjustment log.
- Purpose dropdowns sorted alphabetically.
- Year, type, purpose, status, and free-text filters.
- Status filter tabs with active/inactive counts.
- Column detail drawer with purpose, status, and change history.
- CSV export per year, including status.
- Neutral zinc/cobalt visual system with blue-white and blue-black themes.
- Number ticker, animated chart bars, status badges, command search, and animated drawer.
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
- **Average service life** — days from activation to the date an inactive column was marked inactive.
- **Columns in use** — active columns in the selected year, with inactive columns shown separately.

The per-type table shows these values for each column type. The interval table lists every consecutive activation pair so the cadence can be checked directly.

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
- Use **Export CSV** on the Activations page for a backup. The export includes status and status-change dates.
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
