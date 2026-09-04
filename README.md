# Helping Professions Card Sort

This folder is ready for GitHub Pages and already contains the supplied Supabase project URL and **publishable** key. The publishable key is intentionally safe to include in a public browser-based site. Never add a Supabase secret key, service-role key, or database password to this repository.

## 1. Prepare Supabase once

1. Open the Supabase project.
2. Select **SQL Editor** in the left sidebar.
3. Select **New query**.
4. Open `supabase-setup.sql`, copy the entire file, and paste it into the query.
5. Select **Run**.
6. Confirm that the result says the query completed successfully.

The setup creates a private response table and one public save function. Site visitors can submit responses but cannot read, download, delete, or directly edit the table.

## 2. Publish with GitHub Pages

1. Create a new GitHub repository. A name such as `helping-professions-card-sort` works well.
2. Choose **Public** so GitHub Pages is available with the standard setup.
3. Add the six files from this folder to the top level of the repository:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `cards-data.js`
   - `favicon.svg`
   - `README.md`
4. Commit the files.
5. Open the repository's **Settings**.
6. Select **Pages** under **Code and automation**.
7. Under **Build and deployment**, choose **Deploy from a branch**.
8. Choose the `main` branch and `/ (root)`, then select **Save**.
9. Wait a few minutes for GitHub to display the published URL.

Do not upload `supabase-setup.sql` to the public repository unless you want to keep it there as documentation. It contains no secret, but the website does not need it to run.

## 3. Test before changing ICON

1. Open the GitHub Pages URL in a private/incognito browser window.
2. Complete all 42 cards and select at least one final choice.
3. Select **Save results & unlock printing**.
4. In Supabase, open **Table Editor > card_sort_responses** and confirm one row appears.
5. Confirm **Print or save as PDF** unlocks.

Only after this test succeeds should the ICON iframe be changed from the current site URL to the GitHub Pages URL.

## Editing later

- Edit card wording and career information in `cards-data.js`.
- Edit colors and layout in `styles.css`.
- Edit instructions and page sections in `index.html`.
- Edit sorting, scoring, saving, and printing behavior in `app.js`.

If the card set changes substantially, update `CARD_SET_VERSION` near the top of `app.js` so newer submissions can be distinguished from older ones.

## Downloading responses

In Supabase, open **Table Editor > card_sort_responses**, then use the table's export/download option to save a CSV. Excel opens the CSV directly.

