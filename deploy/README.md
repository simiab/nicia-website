# NICIA website — deploy package

Self-contained static site plus one serverless function. No build step, no dependencies.

    index.html          Homepage (all CSS, fonts, logo and imagery inlined)
    privacy.html        Privacy Notice — served at /privacy
    api/join-house.js   Vercel serverless function: MailerLite "Join the House" proxy
    vercel.json         cleanUrls, so /privacy resolves to privacy.html

## Deploy

**Option A — Git (recommended).** Push this folder to a GitHub repo, then in Vercel:
New Project -> import the repo -> Framework Preset: **Other** -> Deploy.
Leave build command and output directory empty. Every push redeploys.

**Option B — CLI.** From inside this folder: `npx vercel --prod`

After the first deploy, check Settings -> Deployment Protection ->
**Vercel Authentication: Disabled**, or visitors hit a Vercel login page.

## What is wired up

- Consultation enquiry form -> Formspree `https://formspree.io/f/xljderbp`
  (client-side validation, JSON POST, in-modal Thank You state)
- Join the House sign-up -> same-origin `POST /api/join-house` -> MailerLite form
  endpoint `.../2639935/forms/198792572859057792/subscribe` with
  `fields[email]`, `ml-submit=1`, `anticsrf=true`. No API key required.
  Returns `{ok:true}` / `{ok:false}`; failures are logged with the email
  domain only (visible in Vercel runtime logs).
- `/privacy` linked from the footer, the consultation form and Join the House.

## Changing the MailerLite target

Edit `MAILERLITE_FORM_URL` at the top of `api/join-house.js`. Nothing in the
HTML needs to change — the page only ever calls `/api/join-house`.
