# MAI AUTOS — Invoice App

A web-based invoice generator for **MAI AUTOS, Premium Dealership (Abuja)**.
Fill in a form → see a live A4 preview → **Save & Print / Save as PDF** → every invoice is stored in Supabase.

Built with **Next.js 15 + Tailwind CSS**, backed by **Supabase** (Postgres + Auth), and made to deploy on **Vercel**.

| Feature | Details |
| --- | --- |
| Form-based editor | Customer, vehicle (VIN, mileage, colour…), charges, discount, VAT, deposit |
| Live A4 preview | Updates as you type — what you see is what prints |
| Print / PDF | One-click print; choose *Save as PDF* in the print dialog to download |
| Invoice history | Search, reopen, reprint, delete; paid / part-paid / unpaid status |
| Auto numbering | `MA-2026-001`, `MA-2026-002`… (prefix and next number are editable) |
| Multi-currency | USD $, Naira ₦, EUR €, GBP £ per invoice |
| Settings | Company contact, bank details, VAT rate, default terms |
| Staff login | Supabase Auth (email + password). Accounts are created by you in the dashboard |
| Demo mode | Runs without Supabase (saves in the browser) so you can try it first |

---

## 1. Run it locally (optional)

```bash
npm install
npm run dev          # http://localhost:3000  → runs in Demo mode until Supabase keys are added
```

---

## 2. Set up Supabase (≈ 5 minutes)

1. Go to <https://supabase.com> → **New project** (choose a strong database password, any region — Frankfurt/London are closest to Nigeria).
2. In the left menu open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   This creates the `invoices` and `settings` tables with row-level security (only signed-in staff can read or write).
3. Create your staff login: **Authentication → Users → Add user → Create new user**. Enter your email and a password and tick **Auto Confirm User**.
   Repeat for each staff member. Everyone shares the same invoices.
4. Stop strangers from creating accounts: **Authentication → Sign In / Providers → Email → turn off "Allow new users to sign up"** → Save.
5. Copy your keys: **Project Settings → API**
   * **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   * **anon public** key (or the newer *publishable* key) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> The anon/publishable key is safe to use in the browser — the database is protected by the row-level-security policies in `schema.sql`, which only allow signed-in users.

---

## 3. Deploy to Vercel (≈ 5 minutes)

1. Push this folder to a GitHub repository (GitHub → New repository → upload or `git push`).
2. Go to <https://vercel.com> → **Add New → Project** → import the repository. Vercel detects Next.js automatically.
3. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon / publishable key |

4. Click **Deploy**. In about a minute you get a URL such as `https://mai-autos-invoice.vercel.app`.
5. Open it, sign in with the user you created in step 2.3, go to **Settings** and enter your phone, email and bank details. Done.

**Custom domain (optional):** Vercel → Project → Settings → Domains → add e.g. `invoice.maiautos.com` and follow the DNS instructions.

**Add it to your phone's home screen:** open the site in Chrome/Safari → *Add to Home Screen*. It behaves like an app.

---

## 4. Daily use

1. **New Invoice** → fill in the customer and vehicle, add charges, optionally a deposit.
2. **Save & Print / PDF** → the print dialog opens. Choose your printer, or *Save as PDF* to download and send by WhatsApp/email.
3. **Invoices** → search by number, customer or vehicle; reopen to record further payments (the status becomes *Paid* automatically when the balance reaches zero).

---

## Project structure

```
src/
  app/
    page.tsx                    Invoice list / dashboard
    invoices/new/page.tsx       New invoice
    invoices/[id]/page.tsx      Edit invoice
    invoices/[id]/print/page.tsx  Clean print view (auto-opens the print dialog with ?auto=1)
    settings/page.tsx           Company, bank, VAT and numbering settings
    login/page.tsx              Staff sign in
  components/
    InvoiceSheet.tsx            The printable A4 invoice (design shared by preview and print)
    InvoiceEditor.tsx           The form + live preview
    ScaledSheet.tsx             Scales the A4 sheet to fit the screen
    Nav.tsx, ui.tsx             Navigation and form controls
  lib/
    calc.ts, format.ts          Totals, VAT, currency and date formatting
    defaults.ts                 Default settings, terms, invoice numbering
    store/                      Data layer: Supabase (production) or localStorage (demo)
    supabase/client.ts          Supabase browser client
  middleware.ts                 Session refresh + redirects to /login when signed out
supabase/schema.sql             Database tables and security policies
public/logo.png                 Your logo (replace this file to change it)
```

---

## Customising

* **Logo** – replace `public/logo.png` (a wide logo on a black background looks best in the header band).
* **Colours / layout of the printed invoice** – edit `src/components/InvoiceSheet.tsx`.
* **Default terms & conditions** – change them in **Settings** inside the app (or the defaults in `src/lib/defaults.ts`).
* **Currencies** – add to `CURRENCIES` in `src/lib/types.ts`.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Database tables not found" | Run `supabase/schema.sql` in the Supabase SQL Editor |
| Login says incorrect email or password | Create the user under Authentication → Users and tick *Auto Confirm User* |
| App shows "Demo mode" on Vercel | The two environment variables are missing — add them and **redeploy** |
| Header/footer text (URL, date) on the printout | In the print dialog → *More settings* → untick *Headers and footers* |
| Black header prints white | In the print dialog enable *Background graphics* |

## Vehicle inventory

The Inventory page is the first dealership-management module. It supports new, locally used, and foreign-used stock; vehicle identity and specifications; VIN/chassis and engine numbers; stock location; and statuses including in stock, reserved, sold, in transit, and in preparation. Demo mode stores vehicles in this browser. For team use, run the current `supabase/schema.sql` to create the `vehicles` table and its authenticated-staff RLS policy.
