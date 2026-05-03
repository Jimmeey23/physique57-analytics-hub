## Universal Table Copy Functionality

All metric tables now display a copy icon that opens a dropdown with:

1. Copy with styling – rich HTML (keeps header + basic formatting)
2. Copy as text – tab separated plain text for quick spreadsheet pasting
3. Copy all tabs – aggregates every registered table in the current metrics context

### How it works
The app wraps pages in a `MetricsTablesRegistryProvider` (see `App.tsx`). Each table using `ModernTableWrapper`, `TableCard`, or the `useRegisterTableForCopy` hook auto-registers itself. The registry builds a unified export when "Copy all tabs" is chosen.

### Adding to a custom table
If you have a standalone table component:

```tsx
const ref = useRef<HTMLDivElement>(null);
const { getAllTabsText } = useRegisterTableForCopy(ref, 'My Table Title');

<div ref={ref}>
	<CopyTableButton
		tableRef={ref as any}
		tableName="My Table Title"
		onCopyAllTabs={async () => getAllTabsText()}
	/>
	{/* your <Table> ... */}
</div>
```

No manual aggregation is required—registration handles it automatically.

### Notes
* Rich HTML copy falls back to plain text if the browser rejects `ClipboardItem`.
* Auto-registration can be disabled per table via `disableAutoRegistry` on wrappers.
* Each table is keyed by its title; ensure titles are unique within a page when using copy-all.

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/fd1ce843-6bed-47e6-bc6b-8589e9ca6a29

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fd1ce843-6bed-47e6-bc6b-8589e9ca6a29) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fd1ce843-6bed-47e6-bc6b-8589e9ca6a29) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
