# Channel Outfitters — Deployment & DNS Migration Guide

## SITE STRUCTURE
```
site/
├── index.html          (Home)
├── guided-trips.html   (Guided Trips + Pricing)
├── hunting.html        (Trophy Hunting)
├── lodging.html        (Lodging)
├── gallery.html        (Gallery — placeholder grid)
├── about.html          (About — Lindsey & Holly)
├── blog.html           (Field Reports — gated lead capture)
├── CNAME               (GitHub Pages custom domain)
├── css/
│   └── style.css       (All styles)
├── js/
│   └── main.js         (Nav, fade-in, Klaviyo form)
└── images/             (YOU CREATE THIS — add photos here)
    ├── hero-river.jpg
    ├── fishing-card.jpg
    ├── hunting-card.jpg
    ├── guide-on-river.jpg
    ├── guided-hero.jpg
    ├── angler-release.jpg
    ├── drift-boat-fishing.jpg
    ├── hunting-hero.jpg
    ├── elk-hunt.jpg
    ├── deer-hunt.jpg
    ├── antelope-hunt.jpg
    ├── hunting-lodge.jpg
    ├── lodging-hero.jpg
    ├── hidden-canyon-lodge.jpg
    ├── lodging-2.jpg
    ├── lodging-3.jpg
    ├── gallery-hero.jpg
    ├── about-hero.jpg
    ├── lindsey.jpg
    ├── holly.jpg
    ├── reports-hero.jpg
    └── gallery/
        ├── 01.jpg ... 12.jpg (or more)
```

## STEP 1: GITHUB PAGES DEPLOYMENT (for testing)

1. Push all site files to your repo's `main` branch (or a `gh-pages` branch)
2. Go to repo Settings → Pages
3. Source: Deploy from branch → `main` (or `gh-pages`) → `/ (root)`
4. Wait ~60 seconds for build
5. Test at: `https://jordansawceswagger.github.io/ChannelOutfitters/`

**Note:** Remove or rename CNAME file during testing if you don't want it to try custom domain yet.

## STEP 2: ADD IMAGES

For every placeholder in the HTML, search for `img-placeholder` and `background-image` comments.
Replace the placeholder divs with actual `<img>` tags or uncomment the background-image styles.

Example — replacing a card image:
```html
<!-- BEFORE -->
<div class="card-img img-placeholder">PHOTO: Angler with brown trout</div>

<!-- AFTER -->
<img src="images/fishing-card.jpg" alt="Angler with brown trout on dry fly" class="card-img" loading="lazy">
```

Example — replacing a hero background:
```html
<!-- BEFORE -->
<div class="hero-bg img-placeholder" style="/* background-image: url('images/hero-river.jpg'); */">

<!-- AFTER -->
<div class="hero-bg" style="background-image: url('images/hero-river.jpg');">
```

## STEP 3: REPLACE PLACEHOLDERS

Search and replace across all HTML files:

| Find                        | Replace With                    |
|-----------------------------|---------------------------------|
| `(406) 555-1234`           | Actual phone number             |
| `+14065551234`             | Actual phone (E.164 format)     |
| `info@channeloutfitters.com`| Actual email                   |
| `YOUR_COMPANY_ID`          | Klaviyo company ID              |
| Facebook/Instagram URLs     | Actual social links             |

## STEP 4: DNS MIGRATION (Namecheap → GitHub Pages + Google Workspace)

### Current state: Wix nameservers
### Target state: Namecheap BasicDNS

**In Namecheap domain settings:**

1. Change nameservers from Wix → Namecheap BasicDNS
2. Go to Advanced DNS tab
3. Delete all existing records
4. Add these records:

### GitHub Pages (A records + CNAME)
| Type  | Host | Value               | TTL  |
|-------|------|---------------------|------|
| A     | @    | 185.199.108.153     | Auto |
| A     | @    | 185.199.109.153     | Auto |
| A     | @    | 185.199.110.153     | Auto |
| A     | @    | 185.199.111.153     | Auto |
| CNAME | www  | jordansawceswagger.github.io | Auto |

### Google Workspace MX Records
| Type | Host | Value                    | Priority | TTL  |
|------|------|--------------------------|----------|------|
| MX   | @    | aspmx.l.google.com      | 1        | Auto |
| MX   | @    | alt1.aspmx.l.google.com | 5        | Auto |
| MX   | @    | alt2.aspmx.l.google.com | 5        | Auto |
| MX   | @    | alt3.aspmx.l.google.com | 10       | Auto |
| MX   | @    | alt4.aspmx.l.google.com | 10       | Auto |

### Google Workspace Verification & SPF
| Type | Host | Value                                          | TTL  |
|------|------|------------------------------------------------|------|
| TXT  | @    | google-site-verification=YOUR_VERIFICATION_CODE | Auto |
| TXT  | @    | v=spf1 include:_spf.google.com include:spf.klaviyo.com ~all | Auto |

### Klaviyo DKIM (get exact values from Klaviyo DNS settings)
| Type  | Host                        | Value                      | TTL  |
|-------|-----------------------------|----------------------------|------|
| CNAME | k1._domainkey               | dkim.klaviyo.com           | Auto |
| CNAME | k2._domainkey               | dkim2.klaviyo.com          | Auto |

**Note:** The SPF record above combines Google Workspace AND Klaviyo in one record.
You can only have ONE SPF (TXT) record per domain.

### Other verification records to keep
| Type | Host | Value                                          | TTL  |
|------|------|------------------------------------------------|------|
| TXT  | @    | google-site-verification=OiZjuG-9-Vakc2Jhupw1lgpmAU3mmCfGSovcps-nqvg | Auto |
| TXT  | @    | facebook-domain-verification=d261uqjnm0uju84lj01fwl7dw3b2ds | Auto |

## STEP 5: ENABLE HTTPS IN GITHUB PAGES

After DNS propagates (up to 48 hours, usually 1-4):
1. Go to repo Settings → Pages
2. Custom domain: `www.channeloutfitters.com`
3. Check "Enforce HTTPS"
4. GitHub will auto-provision Let's Encrypt SSL

## MIGRATION ORDER (to minimize downtime)

1. Test site on GitHub Pages without custom domain first
2. Add images, replace placeholders, verify everything works
3. Set up Google Workspace (can do before DNS switch)
4. Switch nameservers at Namecheap (this is the cut-over moment)
5. Add all DNS records immediately after nameserver switch
6. Verify GitHub Pages custom domain
7. Verify Google Workspace
8. Verify Klaviyo sending domain
9. Test email deliverability before launching Klaviyo campaigns

## COST SUMMARY
- GitHub Pages: $0/mo
- Google Workspace: $6/mo
- Namecheap domain: ~$10-13/yr (already owned)
- Klaviyo: Free tier (up to 250 contacts, 500 emails/mo)
- **Total: ~$6/mo vs Wix pricing**
