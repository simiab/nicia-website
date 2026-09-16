# NICIA website — deploy package

Self-contained static site plus one serverless function. No build step, no dependencies.
Primary domain: **https://niciastudio.com**

    index.html                  Homepage (CSS, fonts, logo and imagery inlined)
    privacy.html                Privacy Notice — served at /privacy
    api/join-house.js           Vercel serverless function: MailerLite sign-up proxy
    nicia-social-preview.png    1200×630 Open Graph / Twitter card image
    favicon-16/32/48.png        Favicons (pearl N on navy)
    favicon.ico                 Fallback for /favicon.ico requests
    apple-touch-icon.png        180×180 iOS home-screen icon
    robots.txt                  Allows indexing, points to the sitemap
    sitemap.xml                 Homepage + /privacy
    vercel.json                 cleanUrls, so /privacy resolves to privacy.html

## Deploy

**Git (recommended).** Push this folder to a GitHub repo, then in Vercel:
New Project → import the repo → Framework Preset **Other** → Deploy.
Leave build command and output directory empty. If the files sit in a subfolder
of the repo, set **Settings → Build and Deployment → Root Directory** to that folder.

**CLI.** From inside this folder: `npx vercel --prod`

After the first deploy, check **Settings → Deployment Protection →
Vercel Authentication: Disabled**, or visitors hit a Vercel login page.

## Connecting the domain

Add `niciastudio.com` under **Settings → Domains**. All canonical, `og:url`
and sitemap references already point at that domain — nothing in the HTML
needs editing when it goes live.

## What is wired up

- Consultation enquiry → Formspree `https://formspree.io/f/xljderbp`
  (client-side validation, JSON POST, in-modal Thank You state)
- Join the House sign-up → same-origin `POST /api/join-house` → MailerLite form
  endpoint `.../2639935/forms/198792572859057792/subscribe` with `fields[email]`,
  `ml-submit=1`, `anticsrf=true`. No API key required. Returns `{ok:true}` /
  `{ok:false}`; failures are logged with the email domain only (Vercel runtime logs).
- `/privacy` linked from the footer, the consultation form and Join the House.

## Changing the MailerLite target

Edit `MAILERLITE_FORM_URL` at the top of `api/join-house.js`. Nothing in the
HTML changes — the page only ever calls `/api/join-house`.
