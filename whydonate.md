<!DOCTYPE html>
<html lang="en" dir="ltr" data-beasties-container>
    <head>
        <script>
            (function(w, i, g) {
                w[g] = w[g] || [];
                if (typeof w[g].push == 'function')
                    w[g].push(i)
            }
            )(window, 'GTM-5BMZG9VX', 'google_tags_first_party');
        </script>
        <script>
            (function(w, d, s, l) {
                w[l] = w[l] || [];
                (function() {
                    w[l].push(arguments);
                }
                )('set', 'developer_id.dYzg1YT', true);
                w[l].push({
                    'gtm.start': new Date().getTime(),
                    event: 'gtm.js'
                });
                var f = d.getElementsByTagName(s)[0]
                  , j = d.createElement(s);
                j.async = true;
                j.src = '/gtm/';
                f.parentNode.insertBefore(j, f);
            }
            )(window, document, 'script', 'dataLayer');
        </script>
        <meta charset="utf-8">
        <title>WhyDonate | Crowdfunding &amp;Online Fundraising Platform</title>
        <base href="/">
        <meta name="google" content="notranslate">
        <!-- The site has no dark theme. Declaring it here (as well as in 		     _base-reset.scss) stops the browser painting a dark canvas on the first paint, before the stylesheet lands. -->
        <meta name="color-scheme" content="light">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <link rel="icon" type="image/x-icon" href="assets/favicon.ico">
        <link rel="icon" type="image/png" sizes="192x192" href="assets/favicon-192x192.png">
        <link rel="icon" type="image/png" sizes="512x512" href="assets/favicon-512x512.png">
        <link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
        <link rel="dns-prefetch" href="//imagedelivery.net">
        <link rel="preconnect" href="https://imagedelivery.net" crossorigin>
        <!-- No static hero preload here: every hero is CMS-driven now. CSS-bg		     heroes get a <link rel="preload"> from cms-page's injectHeroPreload 		     (server-rendered); the home mosaic renders real <img> tags wit 		     their own fetchpriority (home-hero-block.html), so preloading them 		     would double-download. The old personalHomepageBanner preload that 		     lived here fetched 38KB the CMS home never renders. -->
        <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <!-- No preconnect for client.crisp.chat: Lighthouse reported it unused, and
		     it was. Crisp boots well after load, by which time the browser has
		     already dropped an unused preconnect (~10s), so it only ever spent a
		     handshake. Removing it also brings the page back to the 4 preconnects
		     Lighthouse recommends as the ceiling — the four below/above are all
		     used during load. Do not re-add without measuring. -->
        <!-- Roboto/Raleway body faces moved into the async loader below
		     (display=swap → fallback text paints first, faces swap in).
		     Material Icons (further down) deliberately STAYS render-blocking:
		     loading icon fonts async flashes raw ligature names ("menu",
		     "search") in place of icons. -->
        <!-- Display fonts (Fraunces incl. the 800 weight for .cbp-faq-q, Inter,
		     Material Symbols Rounded). Used beyond the blog (site footer + org/
		     custom-branding headings use Fraunces; symbols appear in shared
		     styles), so they load GLOBALLY but ASYNC via script injection below —
		     never render-blocking. display=swap gives fallback text first paint.
		     The ids match ensureDisplayFonts() (src/app/shared/utils/
		     display-fonts.ts), which the blog/custom-branding routes also call
		     (SSR puts the links in their <head> for the earliest fetch) — the
		     shared ids make both paths dedupe.

		     Material Symbols ships as TWO STATIC INSTANCES, not one variable font.
		     The app only ever needs two axis combinations (verified: exactly two
		     `font-variation-settings` values existed across 7 stylesheets) — the
		     outline (FILL 0 / wght 400) and the filled (FILL 1 / wght 500). Any
		     axis RANGE in the URL makes Google serve a variable font covering that
		     range, which is far larger than the instances:
		         @24,400..500,0..1,0   1,445,628 B   (one variable font)
		         @24,400,0,0             369,596 B   (outline instance)
		         @24,500,1,0             507,044 B   (filled instance)
		     Both instances together are 876,640 B — 569 KB less than the range.
		     (The original unrestricted request was 5,349,652 B.)

		     Both URLs return `font-family: 'Material Symbols Rounded'` with
		     DIFFERENT font-weight descriptors (400 and 500), so they register as
		     two faces of one family and CSS picks between them by weight:
		     `.msi { font-weight: 400 }` = outline, `.msi.fill { font-weight: 500 }`
		     = filled. That weight is NOT boldness — it selects the fill variant.
		     `font-variation-settings` no longer does anything here (a static
		     instance has no axes) and was removed from the stylesheets.

		     Both instances are ALSO SUBSET with `&icon_names=`, which is what
		     takes the pair from 875,532 B to ~39,900 B — an 835 KB saving, and the
		     single biggest win available on the mobile home page (fonts were
		     1,205 KB of its 2,415 KB, requested at VeryHigh priority ahead of the
		     hero image, which put LCP's load-delay phase at ~2s of a 4.8s LCP).

		     The earlier objection to subsetting — a CMS editor can type any icon
		     name into a block's `icon` field — is handled rather than avoided:
		     scripts/generate-icon-names.mjs builds the list from static template
		     literals AND the CMS fallback snapshot AND live Payload content, and
		     ensureIconFontCoverage() in display-fonts.ts swaps in the full font at
		     runtime if a name outside the subset ever renders. Over-inclusion is
		     free: the Fonts API returns 200 and ignores names it does not know.

		     The list below is GENERATED — edit it with
		     `npm run generate-icon-names`, never by hand. Do NOT reintroduce axis
		     ranges, and keep both URLs byte-identical to display-fonts.ts (which
		     builds them from the same generated constant) so the id dedupe holds. -->
        <script>
            (function() {
                /* BEGIN GENERATED ICON NAMES */
                var iconNames = 'account_balance,account_balance_wallet,account_circle,add,add_box,add_photo_alternate,alternate_email,apps,arrow_back,arrow_back_ios,arrow_circle_right,arrow_drop_down,arrow_drop_up,arrow_forward,arrow_forward_ios,arrow_left,auto_awesome,autorenew,badge,balance,battery_full,block,bolt,book,briefcase,browser,building,calendar,calendar_month,calendar_today,call,campaign,cancel,card,celebration,chat,chat_bubble_outline,check,check_circle,chevron_left,chevron_right,child_care,church,clear,close,code,code_off,color_lens,colors,content_copy,cookie,corporate_fare,cottage,credit_card,crm,currency,currency_bitcoin,currency_exchange,customizable,dashboard,database,delete,diversity_3,dns,domain,eco,edit,edit_square,emails,emergency,emoji_events,encrypted,eu,event_available,event_repeat,exercise,expand_more,explore,favorite,fee,file_download,file_upload,filecheck,filter_list,flame,flight,forms,forum,gavel,globe,gpp_good,graduation,grid,grid_view,groups,handshake,headset,headset_mic,health_and_safety,heart,help_outline,home,home_work,house,how_to_vote,hub,info,integration,inventory_2,keyboard_arrow_left,label,languages,launch,lifebuoy,lightbulb,link,list,list_alt,local_florist,location_on,lock,logo,logout,mail,mark_email_read,medal,medical_services,menu,menu_book,menu_open,monitoring,movie,near_me,network,nonprofit,nonprofits,notifications_none,open_in_new,paid,palette,password,payments,payouts,percent,person,pets,play_circle,policy,priority_high,profile,public,public_off,puzzle,qr,radar,refresh,replay,restaurant,rocket_launch,savings,scanface,schedule,school,scissors,search,search_off,secure,sell,send,sentiment_satisfied,share,shield,signal_cellular_alt,smart_toy,source_notes,sports_soccer,star,support,support_agent,supporters,text_fields,translate,trending_up,trophy,update,upload,users,verified,verified_user,videocam,visibility,visibility_off,volunteer_activism,warning,website,wifi,work,workspace_premium,zap';
                /* END GENERATED ICON NAMES */
                var symbols = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@';
                var subset = iconNames ? '&icon_names=' + iconNames : '';
                var sheets = [{
                    id: 'wd-body-fonts',
                    href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Raleway:wght@300;400;500&display=swap',
                }, {
                    id: 'wd-display-fonts-faces',
                    href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,500;1,9..144,600;1,9..144,700&family=Inter:wght@400;500;600;700;800;900&display=swap',
                }, {
                    id: 'wd-display-fonts-symbols',
                    href: symbols + '24,400,0,0' + subset + '&display=swap',
                }, {
                    id: 'wd-display-fonts-symbols-fill',
                    href: symbols + '24,500,1,0' + subset + '&display=swap',
                }, ];
                for (var i = 0; i < sheets.length; i++) {
                    if (document.getElementById(sheets[i].id))
                        continue;
                    var l = document.createElement('link');
                    l.id = sheets[i].id;
                    l.rel = 'stylesheet';
                    l.crossOrigin = 'anonymous';
                    l.href = sheets[i].href;
                    document.head.appendChild(l);
                }
            }
            )();
        </script>
        <!-- The no-JS copies stay UNSUBSETTED on purpose: without the loader above
		     there is nothing to interpolate the generated icon list into, and a
		     no-JS visitor getting every glyph is worth more than the bytes. -->
        <noscript>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Raleway:wght@300;400;500&display=swap" rel="stylesheet" crossorigin="anonymous">
            <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,500;1,9..144,600;1,9..144,700&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" crossorigin="anonymous">
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" crossorigin="anonymous">
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,1,0&display=swap" rel="stylesheet" crossorigin="anonymous">
        </noscript>
        <!-- NO Google icon stylesheet any more. Every Material icon family the app
		     used has been consolidated onto the two Material Symbols Rounded
		     instances loaded above, removing a RENDER-BLOCKING third-party
		     stylesheet and 603,290 B of font from every page load:
		         Material Symbols Outlined  319,662 B  (19 usages, 11 icons)
		         Material Icons             128,352 B  (~346 usages, FILLED)
		         Material Icons Outlined    155,276 B  (~341 usages, outline)
		     The `.material-icons` / `.material-icons-outlined` class names are kept
		     and repointed at Material Symbols Rounded in
		     styles/helpers-classes/_layout_helpers.scss — that file explains why the
		     names were not renamed and how FILL is preserved (weight 500 = filled,
		     400 = outline). All 59 icon names in use were verified present in the
		     Rounded instance first.

		     Consequence worth knowing: this IS a visual change. Material Symbols is
		     Google's 2022 redraw, so stroke weights and some glyph shapes differ
		     from the 2014 Material Icons across roughly 690 icons app-wide. It
		     wants a design pass before release. -->
        <!-- (icon stylesheet intentionally removed) -->
        <!-- Org-branding font palette (Noto Serif, PT Sans/Serif, Source Sans Pro,
		     Work Sans, Yatra One + 700 weights). Only branded fundraiser pages and
		     the branding editor use these, so the stylesheet must load
		     asynchronously. Injected via script (NOT a media="print" swap link):
		     the build's critical-CSS inliner rewrites <link> tags and silently
		     stripped the media/onload attributes, shipping this render-blocking —
		     a script-created link is immune. Verify in the BUILT index, not here. -->
        <script>
            (function() {
                var l = document.createElement('link');
                l.rel = 'stylesheet';
                l.crossOrigin = 'anonymous';
                l.href = 'https://fonts.googleapis.com/css?family=Raleway:400,500,700|Roboto:400,500,700|Noto+Serif:400,700|PT+Sans:400,700|PT+Serif:400,700|Source+Sans+Pro:400,700,900|Work+Sans:400,700,900|Yatra+One&display=swap';
                document.head.appendChild(l);
            }
            )();
        </script>
        <noscript>
            <link href="https://fonts.googleapis.com/css?family=Raleway:400,500,700|Roboto:400,500,700|Noto+Serif:400,700|PT+Sans:400,700|PT+Serif:400,700|Source+Sans+Pro:400,700,900|Work+Sans:400,700,900|Yatra+One&display=swap" rel="stylesheet" crossorigin="anonymous">
        </noscript>
        <!-- Stripe.js is NOT loaded globally: the donation form loads it on demand
	     via loadStripe() (@stripe/stripe-js injects its own script), so content
	     pages no longer spend mobile bandwidth on it. Verified: no other
	     window.Stripe consumer exists.

	     The js.stripe.com PRECONNECT that used to sit with the others is gone.
	     It was kept to make the eventual on-demand load fast on donate pages,
	     but loadStripe only ever runs in the donation and fundraiser-donation
	     components — never on a content page — so on every SSR'd page it was
	     Lighthouse's "unused preconnect", spending a TLS handshake on an origin
	     the page never calls. Same reasoning that removed the Crisp preconnect
	     above. If a donate route ever needs the head start, add the hint from
	     that route, not globally. -->
        <style>
            #unsupported-message {
                display: none;
                text-align: center;
                padding: 20px;
                font-family: 'Roboto', sans-serif;
                color: #333;
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                margin: 20px;
                border-radius: 5px;
            }

            #unsupported-message .ios-update-link {
                color: #007bff;
                text-decoration: none;
            }
        </style>
        <style>
            *,:before,:after {
                --tw-border-spacing-x: 0;
                --tw-border-spacing-y: 0;
                --tw-translate-x: 0;
                --tw-translate-y: 0;
                --tw-rotate: 0;
                --tw-skew-x: 0;
                --tw-skew-y: 0;
                --tw-scale-x: 1;
                --tw-scale-y: 1;
                --tw-pan-x: ;
                --tw-pan-y: ;
                --tw-pinch-zoom: ;
                --tw-scroll-snap-strictness: proximity;
                --tw-gradient-from-position: ;
                --tw-gradient-via-position: ;
                --tw-gradient-to-position: ;
                --tw-ordinal: ;
                --tw-slashed-zero: ;
                --tw-numeric-figure: ;
                --tw-numeric-spacing: ;
                --tw-numeric-fraction: ;
                --tw-ring-inset: ;
                --tw-ring-offset-width: 0px;
                --tw-ring-offset-color: #fff;
                --tw-ring-color: rgb(59 130 246 / .5);
                --tw-ring-offset-shadow: 0 0 #0000;
                --tw-ring-shadow: 0 0 #0000;
                --tw-shadow: 0 0 #0000;
                --tw-shadow-colored: 0 0 #0000;
                --tw-blur: ;
                --tw-brightness: ;
                --tw-contrast: ;
                --tw-grayscale: ;
                --tw-hue-rotate: ;
                --tw-invert: ;
                --tw-saturate: ;
                --tw-sepia: ;
                --tw-drop-shadow: ;
                --tw-backdrop-blur: ;
                --tw-backdrop-brightness: ;
                --tw-backdrop-contrast: ;
                --tw-backdrop-grayscale: ;
                --tw-backdrop-hue-rotate: ;
                --tw-backdrop-invert: ;
                --tw-backdrop-opacity: ;
                --tw-backdrop-saturate: ;
                --tw-backdrop-sepia: ;
                --tw-contain-size: ;
                --tw-contain-layout: ;
                --tw-contain-paint: ;
                --tw-contain-style:
            }

            .container {
                width: 100%
            }

            @media(min-width: 640px) {
                .container {
                    max-width:640px
                }
            }

            @media(min-width: 768px) {
                .container {
                    max-width:768px
                }
            }

            @media(min-width: 1024px) {
                .container {
                    max-width:1024px
                }
            }

            @media(min-width: 1280px) {
                .container {
                    max-width:1280px
                }
            }

            @media(min-width: 1536px) {
                .container {
                    max-width:1536px
                }
            }

            .absolute {
                position: absolute
            }

            .relative {
                position: relative
            }

            .left-0 {
                left: 0
            }

            .top-0 {
                top: 0
            }

            .isolate {
                isolation: isolate
            }

            .mx-auto {
                margin-left: auto;
                margin-right: auto
            }

            .mt-auto {
                margin-top: auto
            }

            .block {
                display: block
            }

            .flex {
                display: flex
            }

            .grid {
                display: grid
            }

            .h-\[100dvh\] {
                height: 100dvh
            }

            .h-full {
                height: 100%
            }

            .min-h-0 {
                min-height: 0px
            }

            .min-h-\[calc\(100dvh-80px\)\] {
                min-height: calc(100dvh - 80px)
            }

            .min-h-full {
                min-height: 100%
            }

            .w-full {
                width: 100%
            }

            .min-w-0 {
                min-width: 0px
            }

            .max-w-none {
                max-width: none
            }

            .flex-1 {
                flex: 1 1 0%
            }

            .cursor-pointer {
                cursor: pointer
            }

            .flex-row {
                flex-direction: row
            }

            .flex-col {
                flex-direction: column
            }

            .overflow-hidden {
                overflow: hidden
            }

            .overflow-y-auto {
                overflow-y: auto
            }

            .overscroll-contain {
                overscroll-behavior: contain
            }

            .border-none {
                border-style: none
            }

            .bg-transparent {
                background-color: transparent
            }

            .bg-white {
                --tw-bg-opacity: 1;
                background-color: rgb(255 255 255 / var(--tw-bg-opacity, 1))
            }

            .text-14 {
                font-size: 14px
            }

            .text-18 {
                font-size: 18px
            }

            .text-22 {
                font-size: 22px
            }

            .text-24 {
                font-size: 24px
            }

            .\[scrollbar-gutter\:stable\] {
                scrollbar-gutter: stable
            }

            *,:before,:after {
                box-sizing: border-box
            }

            html {
                color-scheme: only light;
                background-color: #fff;
                scrollbar-gutter: stable
            }

            body {
                font-family: Roboto,sans-serif
            }

            button {
                font-family: inherit;
                font-size: 100%;
                line-height: inherit;
                color: inherit
            }

            html,body {
                margin: 0;
                padding: 0
            }

            :root {
                --custom-font-family: "Roboto", sans-serif;
                --theme-primary-50: #eefaf1;
                --theme-primary-80: color-mix( in srgb, var(--theme-primary-100) 30%, var(--theme-primary-50) 70% );
                --theme-primary-100: #d6f4dd;
                --theme-primary-200: #aeeabc;
                --theme-primary-300: #7eda95;
                --theme-primary-400: #53cb73;
                --theme-primary-500: #32bf55;
                --theme-primary-600: #26a045;
                --theme-primary-700: #1e8238;
                --theme-primary-800: #1a682e;
                --theme-primary-900: #164f24;
                --theme-primary-contrast-50: rgba(0, 0, 0, .87);
                --theme-primary-contrast-100: rgba(0, 0, 0, .87);
                --theme-primary-contrast-200: rgba(0, 0, 0, .87);
                --theme-primary-contrast-300: rgba(0, 0, 0, .87);
                --theme-primary-contrast-400: rgba(0, 0, 0, .87);
                --theme-primary-contrast-500: white;
                --theme-primary-contrast-600: white;
                --theme-primary-contrast-700: white;
                --theme-primary-contrast-800: white;
                --theme-primary-contrast-900: white;
                --theme-secondary-50: #dfdef4;
                --theme-secondary-100: #a7a5e0;
                --theme-secondary-200: #7e7bd2;
                --theme-secondary-300: #4a46c0;
                --theme-secondary-400: #3e3bad;
                --theme-secondary-500: #363396;
                --theme-secondary-600: #2e2b7f;
                --theme-secondary-700: #262368;
                --theme-secondary-800: #1d1c51;
                --theme-secondary-900: #15143b;
                --theme-secondary-contrast-50: rgba(0, 0, 0, .87);
                --theme-secondary-contrast-100: rgba(0, 0, 0, .87);
                --theme-secondary-contrast-200: rgba(0, 0, 0, .87);
                --theme-secondary-contrast-300: white;
                --theme-secondary-contrast-400: white;
                --theme-secondary-contrast-500: white;
                --theme-secondary-contrast-600: white;
                --theme-secondary-contrast-700: white;
                --theme-secondary-contrast-800: white;
                --theme-secondary-contrast-900: white;
                --theme-warn-500: #ff5656;
                --wd-brand: var(--theme-primary-500);
                --wd-brand-hover: var(--theme-primary-600);
                --wd-brand-pressed: var(--theme-primary-700);
                --wd-brand-soft: var(--theme-primary-50);
                --wd-fg: #1c1c1c;
                --wd-fg-2: #505050;
                --wd-fg-3: #6b6b6b;
                --wd-fg-4: #878787;
                --wd-fg-inverse: #ffffff;
                --wd-bg: #ffffff;
                --wd-bg-subtle: #f6f6f6;
                --wd-bg-muted: #ececec;
                --wd-bg-tint: var(--theme-primary-50);
                --wd-border: #d9d9d9;
                --wd-border-strong: #c2c2c2;
                --wd-red: #e54848;
                --wd-red-soft: #fde4e4;
                --wd-amber: #f5b433;
                --wd-amber-soft: #fff3d9;
                --wd-success: #1e9e4a;
                --wd-success-soft: #dcf5e5;
                --wd-info: #0ea5b7;
                --wd-info-soft: #d7f3f6;
                --wd-blue: #2e7cf6;
                --wd-blue-soft: #e0edff;
                --wd-coral: #ff6b5b;
                --wd-coral-soft: #ffe5e1;
                --wd-blocked: #4f46e5;
                --wd-blocked-soft: #e0def9;
                --wd-disabled: #c2c2c2;
                --wd-disabled-soft: #ececec;
                --wd-disabled-fg: #878787;
                --wd-shadow-xs: 0 1px 2px rgba(26, 43, 31, .04);
                --wd-shadow-sm: 0 1px 2px rgba(26, 43, 31, .04), 0 1px 3px rgba(26, 43, 31, .06);
                --wd-shadow-md: 0 2px 6px rgba(26, 43, 31, .035), 0 10px 28px rgba(26, 43, 31, .05);
                --wd-shadow-lg: 0 8px 20px rgba(26, 43, 31, .05), 0 28px 72px rgba(26, 43, 31, .07);
                --wd-shadow-focus: 0 0 0 3px rgba(50, 191, 85, .3);
                --wd-font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                --wd-font-display: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                --wd-font-mono: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                --wd-fs-display: 57px;
                --wd-fs-h1: 45px;
                --wd-fs-h2: 36px;
                --wd-fs-h3: 28px;
                --wd-fs-h4: 22px;
                --wd-fs-body: 16px;
                --wd-fs-body-sm: 14px;
                --wd-fs-caption: 12px;
                --wd-fs-micro: 11px;
                --wd-lh-tight: 1.12;
                --wd-lh-snug: 1.28;
                --wd-lh-normal: 1.55;
                --wd-lh-loose: 1.7;
                --wd-tracking-tight: -.02em;
                --wd-tracking-normal: 0;
                --wd-tracking-wide: .04em;
                --wd-tracking-caps: .08em;
                --wd-sp-1: 4px;
                --wd-sp-2: 8px;
                --wd-sp-3: 12px;
                --wd-sp-4: 16px;
                --wd-sp-5: 20px;
                --wd-sp-6: 24px;
                --wd-sp-8: 32px;
                --wd-sp-10: 40px;
                --wd-sp-12: 48px;
                --wd-sp-16: 64px;
                --wd-sp-20: 80px;
                --wd-sp-24: 96px;
                --wd-sp-32: 128px;
                --wd-radius-xs: 4px;
                --wd-radius-sm: 10px;
                --wd-radius-md: 12px;
                --wd-radius-lg: 16px;
                --wd-radius-xl: 20px;
                --wd-radius-2xl: 24px;
                --wd-radius-pill: 999px;
                --wd-ease-out: cubic-bezier(.22, .61, .36, 1);
                --wd-ease-std: cubic-bezier(.4, 0, .2, 1);
                --wd-dur-fast: .12s;
                --wd-dur-med: .2s;
                --wd-dur-slow: .4s
            }

            .app-sidenav-drawer:not(.absolute) {
                z-index: 10;
                box-shadow: 4px 0 8px -2px #00000026
            }

            app-header {
                --wd-green: #2bae72;
                --wd-green-dark: #1e8a57;
                --wd-green-deep: #0f4a30;
                --wd-green-tint: #f0faf3;
                --wd-green-soft: #e6f7ee;
                --wd-ink: #1a1a14;
                --wd-ink2: #3a3f36;
                --wd-muted: #6e7566;
                --wd-muted2: #8b9485;
                --wd-border: #e2edea;
                display: block;
                font-family: Inter,Inter Fallback,system-ui,sans-serif
            }

            app-header .site-nav {
                position: relative;
                background: #fff;
                border-bottom: 1px solid var(--wd-border);
                z-index: 50
            }

            app-header .nav-inner {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                align-items: center;
                height: 74px;
                padding: 0 28px;
                max-width: 1200px;
                margin: 0 auto;
                gap: 16px
            }

            app-header .nav-left {
                display: flex;
                align-items: center;
                gap: 4px;
                justify-self: start;
                min-width: 0
            }

            app-header .logo {
                display: flex;
                align-items: center;
                justify-self: center;
                cursor: pointer
            }

            app-header .logo img {
                height: 30px;
                width: auto;
                max-width: 100%;
                object-fit: contain;
                display: block
            }

            app-header .nav-right {
                display: flex;
                align-items: center;
                gap: 10px;
                justify-self: end
            }

            app-header .nav-menubar {
                display: flex;
                align-items: center;
                gap: 2px
            }

            app-header .nav-item {
                position: relative
            }

            app-header .nav-link {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 14.5px;
                font-weight: 700;
                color: var(--wd-ink2);
                background: transparent;
                padding: 9px 12px;
                border-radius: 10px;
                cursor: pointer;
                line-height: 1;
                white-space: nowrap;
                border: none;
                font-family: inherit;
                transition: color .15s,background .15s
            }

            app-header .nav-link .caret {
                font-size: 18px;
                opacity: .7;
                transition: transform .2s
            }

            app-header .nav-link:hover {
                color: var(--wd-green-dark);
                background: var(--wd-green-tint)
            }

            app-header .nav-icon-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: grid;
                place-items: center;
                overflow: hidden;
                color: var(--wd-ink2);
                background: #fff;
                border: 1px solid var(--wd-border);
                cursor: pointer;
                flex: 0 0 auto;
                transition: background .15s,color .15s,border-color .15s
            }

            app-header .nav-icon-btn:hover {
                background: var(--wd-green-tint);
                color: var(--wd-green-dark);
                border-color: var(--wd-green)
            }

            app-header .nav-icon-btn.nav-search {
                text-decoration: none
            }

            app-header .nav-login {
                font-size: 15px;
                font-weight: 700;
                color: var(--wd-ink2);
                padding: 10px 12px;
                cursor: pointer;
                white-space: nowrap
            }

            app-header .nav-login:hover {
                color: var(--wd-ink)
            }

            app-header .btn-primary.nav-cta {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-weight: 800;
                font-size: 14.5px;
                padding: 11px 20px;
                border-radius: 999px;
                background: var(--wd-green);
                color: #fff;
                border: none;
                cursor: pointer;
                white-space: nowrap;
                box-shadow: 0 8px 20px #2bae724d;
                transition: background .16s,transform .16s,box-shadow .16s
            }

            app-header .btn-primary.nav-cta:hover {
                background: var(--wd-green-dark);
                transform: translateY(-1px);
                box-shadow: 0 12px 28px #2bae7266
            }

            app-header .nav-burger {
                display: none;
                width: 42px;
                height: 42px;
                border-radius: 11px;
                border: 1px solid var(--wd-border);
                background: #fff;
                place-items: center;
                color: var(--wd-ink);
                cursor: pointer;
                flex: 0 0 auto
            }

            app-header .nav-burger:hover {
                background: var(--wd-green-tint);
                border-color: var(--wd-green)
            }

            app-header .mega {
                position: absolute;
                top: calc(100% - 2px);
                left: calc((100% - min(100%,1200px))/2 + 28px);
                transform-origin: top left;
                transform: translateY(8px);
                background: #fff;
                border: 1px solid var(--wd-border);
                border-radius: 18px;
                box-shadow: 0 30px 70px -12px #14281e38,0 8px 24px -8px #14281e24;
                opacity: 0;
                visibility: hidden;
                transition: opacity .18s ease,transform .26s cubic-bezier(.22,.61,.36,1);
                z-index: 60;
                max-width: calc(100vw - 32px);
                overflow: hidden
            }

            app-header .m-drawer {
                position: fixed;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                z-index: 90;
                display: none
            }

            app-header .m-scrim {
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                background: #0f1e1673;
                backdrop-filter: blur(2px);
                -webkit-backdrop-filter: blur(2px);
                animation: wd-scrim-in .25s ease
            }

            app-header .m-panel {
                position: absolute;
                top: 0;
                right: 0;
                height: 100%;
                width: min(380px,86vw);
                background: #fff;
                box-shadow: -20px 0 60px #14281e33;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                animation: wd-drawer-in .28s cubic-bezier(.4,0,.2,1)
            }

            app-header .m-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 18px 20px;
                border-bottom: 1px solid var(--wd-border);
                position: sticky;
                top: 0;
                background: #fff;
                z-index: 2
            }

            app-header .m-head .m-logo {
                height: 28px
            }

            app-header .m-close {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                display: grid;
                place-items: center;
                color: var(--wd-ink);
                background: #f4f6f4;
                border: none;
                cursor: pointer
            }

            app-header .m-close:hover {
                background: var(--wd-green-tint);
                color: var(--wd-green-dark)
            }

            app-header .m-body {
                padding: 10px 14px 20px;
                flex: 1
            }

            app-header .m-group {
                border-bottom: 1px solid var(--wd-green-tint)
            }

            app-header .m-acc {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                padding: 16px 8px;
                font-family: inherit;
                font-size: 17px;
                font-weight: 800;
                color: var(--wd-ink);
                background: none;
                text-align: left;
                border: none;
                cursor: pointer
            }

            app-header .m-acc .chev {
                font-size: 22px;
                color: var(--wd-muted2);
                transition: transform .25s
            }

            app-header .m-sub {
                display: grid;
                grid-template-rows: 0fr;
                transition: grid-template-rows .28s ease
            }

            app-header .m-sub>div {
                overflow: hidden;
                padding-bottom: 10px;
                visibility: hidden;
                transition: visibility 0s linear .28s
            }

            app-header .m-sub .m-sublabel {
                display: block;
                padding: 12px 8px 4px;
                font-size: 11.5px;
                font-weight: 800;
                letter-spacing: .05em;
                text-transform: uppercase;
                color: var(--wd-muted2)
            }

            app-header .m-sub a {
                display: flex;
                align-items: center;
                gap: 13px;
                padding: 11px 8px;
                font-size: 15.5px;
                font-weight: 700;
                color: var(--wd-ink);
                text-decoration: none;
                border-radius: 12px;
                min-height: 52px
            }

            app-header .m-sub a:hover,app-header .m-sub a:active {
                color: var(--wd-green-dark);
                background: var(--wd-green-tint)
            }

            app-header .m-sub a .mi {
                flex: 0 0 22px;
                width: 22px;
                height: 22px;
                display: grid;
                place-items: center;
                color: var(--wd-ink);
                transition: color .15s
            }

            app-header .m-sub a .mi svg {
                width: 20px;
                height: 20px;
                display: block
            }

            app-header .m-sub a:hover .mi,app-header .m-sub a:active .mi {
                color: var(--wd-green-dark)
            }

            app-header .m-foot {
                padding: 18px 20px 28px;
                border-top: 1px solid var(--wd-border);
                display: flex;
                flex-direction: column;
                gap: 10px;
                position: sticky;
                bottom: 0;
                background: #fff
            }

            app-header .m-foot .btn-primary,app-header .m-foot .btn-outline {
                width: 100%;
                padding: 14px;
                border-radius: 999px;
                font-weight: 700;
                font-size: 15px;
                text-align: center;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center
            }

            app-header .m-foot .btn-primary {
                background: var(--wd-green);
                color: #fff;
                border: none
            }

            app-header .m-foot .btn-primary:hover {
                background: var(--wd-green-dark)
            }

            app-header .m-foot .btn-outline {
                border: 1.5px solid var(--wd-border);
                color: var(--wd-ink);
                background: #fff;
                text-decoration: none;
                gap: 10px
            }

            app-header .m-foot .btn-outline .mi {
                flex: 0 0 22px;
                width: 22px;
                height: 22px;
                display: grid;
                place-items: center
            }

            app-header .m-foot .btn-outline .mi svg {
                width: 20px;
                height: 20px;
                display: block
            }

            app-header .m-foot .btn-outline:hover {
                background: var(--wd-green-tint);
                border-color: var(--wd-green);
                color: var(--wd-green-dark)
            }

            app-header .m-foot .m-login {
                text-align: center;
                font-weight: 800;
                color: var(--wd-ink2);
                padding: 8px;
                cursor: pointer
            }

            @media(max-width: 1200px) {
                app-header .nav-menubar {
                    display:none
                }

                app-header .nav-login {
                    display: none
                }

                app-header .nav-burger {
                    display: grid
                }

                app-header .btn-primary.nav-cta {
                    display: none
                }

                app-header .nav-inner {
                    grid-template-columns: auto minmax(0,1fr) auto;
                    column-gap: 0;
                    row-gap: 10px
                }

                app-header .nav-left>* {
                    margin-right: 10px
                }

                app-header .nav-right {
                    margin-left: 10px
                }

                app-header .logo {
                    justify-self: start;
                    min-width: 0
                }

                app-header .logo img {
                    height: 26px
                }

                app-header .mega {
                    display: none
                }
            }

            @media(max-width: 560px) {
                app-header .nav-inner {
                    padding:0 16px
                }

                app-header .nav-right {
                    min-width: 0
                }
            }

            @keyframes wd-drawer-in {
                0% {
                    transform: translate(100%)
                }

                to {
                    transform: translate(0)
                }
            }

            @keyframes wd-scrim-in {
                0% {
                    opacity: 0
                }

                to {
                    opacity: 1
                }
            }

            @media(prefers-reduced-motion:reduce) {
                app-header .m-panel,app-header .m-scrim {
                    animation-duration: .001ms
                }

                app-header .m-sub,app-header .m-sub>div {
                    transition-duration: .001ms
                }

                app-header .m-sub>div {
                    transition-delay: .001ms
                }
            }

            app-footer {
                --wd-green: #2bae72;
                --footer-bg: #111c17;
                display: block;
                font-family: Inter,Inter Fallback,system-ui,sans-serif;
                line-height: 1.6
            }

            app-footer .site-footer {
                background: var(--footer-bg);
                color: #a8b3a9;
                padding: 72px 0 36px
            }

            app-footer .footer-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 28px
            }

            app-footer .foot-grid {
                display: grid;
                grid-template-columns: minmax(0,1fr) minmax(0,1.3fr) minmax(0,1.05fr) minmax(0,.65fr);
                gap: 40px;
                margin-bottom: 24px;
                padding-bottom: 24px;
                border-bottom: 1px solid rgba(255,255,255,.08)
            }

            app-footer .foot-col h4 {
                color: #fff;
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 600;
                font-size: 17px;
                letter-spacing: -.005em;
                margin-bottom: 20px;
                text-transform: none
            }

            app-footer .foot-col ul {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: 13px
            }

            app-footer .foot-col li {
                margin: 0;
                padding: 0;
                list-style: none
            }

            app-footer .foot-col a {
                color: #a8b3a9;
                font-size: 14.5px;
                font-weight: 600;
                transition: color .15s;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 8px
            }

            app-footer .foot-col a:hover {
                color: #fff
            }

            app-footer .foot-more {
                margin: -4px 0 28px
            }

            app-footer .foot-more-toggle,app-footer .foot-more-toggle span {
                color: var(--wd-green)
            }

            app-footer .foot-more-toggle {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: none;
                border: none;
                font-family: inherit;
                font-weight: 700;
                font-size: 14.5px;
                padding: 18px 0;
                cursor: pointer
            }

            app-footer .foot-more-toggle .chev {
                font-size: 20px;
                transition: transform .25s
            }

            app-footer .foot-more-toggle:hover,app-footer .foot-more-toggle:hover span {
                color: #7be0a3
            }

            app-footer .foot-bottom {
                display: flex;
                align-items: center;
                gap: 22px;
                flex-wrap: wrap;
                margin-bottom: 26px
            }

            app-footer .fb-logo {
                cursor: pointer
            }

            app-footer .fb-logo img {
                height: 28px;
                filter: brightness(0) invert(1)
            }

            app-footer .foot-rating {
                display: inline-flex;
                align-items: center;
                gap: 9px;
                text-decoration: none
            }

            app-footer .foot-rating .stars {
                color: #ffb200;
                letter-spacing: 1.5px;
                font-size: 15px
            }

            app-footer .foot-rating .rt {
                font-size: 13.5px;
                font-weight: 700;
                color: #d2dbd5
            }

            app-footer .socials {
                display: flex;
                gap: 8px;
                margin-left: auto
            }

            app-footer .socials a {
                width: 38px;
                height: 38px;
                border-radius: 10px;
                background: #ffffff12;
                display: grid;
                place-items: center;
                color: #fff;
                transition: background .2s,transform .2s
            }

            app-footer .socials a:hover {
                background: var(--wd-green);
                transform: translateY(-2px)
            }

            app-footer .foot-legal {
                display: flex;
                align-items: center;
                gap: 18px 24px;
                flex-wrap: wrap;
                font-size: 13.5px;
                color: #7e8a80;
                font-weight: 600
            }

            app-footer .foot-legal a {
                color: #7e8a80;
                display: inline-flex;
                align-items: center;
                gap: 7px;
                transition: color .15s;
                text-decoration: none
            }

            app-footer .foot-legal a:hover {
                color: #fff
            }

            app-footer .foot-badges {
                display: flex;
                align-items: center;
                gap: 14px;
                margin-left: auto;
                flex-wrap: wrap
            }

            app-footer .badge-eu {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                color: #9fc0e8;
                font-weight: 700;
                font-size: 13px
            }

            app-footer .badge-eu .euflag {
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: #1a3a8f;
                display: grid;
                place-items: center;
                color: #ffd43b;
                font-size: 11px;
                line-height: 1
            }

            app-footer .badge-chip {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                background: #fff;
                color: #0a2540;
                border-radius: 8px;
                padding: 6px 11px;
                font-weight: 800;
                font-size: 12px
            }

            app-footer .badge-chip .stripe {
                color: #635bff;
                font-weight: 900;
                font-size: 14px
            }

            app-footer .badge-chip .vbar {
                width: 1px;
                height: 14px;
                background: #0a254029
            }

            app-footer .badge-chip .vchk {
                width: 15px;
                height: 15px;
                border-radius: 50%;
                background: #635bff;
                color: #fff;
                display: grid;
                place-items: center
            }

            app-footer .badge-chip .vchk .material-icons-outlined {
                font-size: 11px
            }

            app-footer .foot-bottom app-language-chooser .lang-trigger {
                color: #d2dbd5;
                background: #ffffff0f;
                border: 1px solid rgba(255,255,255,.12)
            }

            app-footer .foot-bottom app-language-chooser .lang-trigger:hover {
                background: #ffffff1a;
                color: #fff
            }

            @media(max-width: 980px) {
                app-footer .foot-grid {
                    grid-template-columns:1fr 1fr
                }
            }

            @media(max-width: 680px) {
                app-footer .foot-bottom {
                    flex-direction:column;
                    align-items: flex-start;
                    gap: 18px
                }

                app-footer .socials {
                    margin-left: 0
                }

                app-footer .foot-badges {
                    margin-left: 0
                }
            }

            @media(max-width: 480px) {
                app-footer .foot-grid {
                    grid-template-columns:1fr
                }
            }

            :root {
                --whydonate-body-font-size: 16px
            }

            .material-icons-outlined {
                font-style: normal;
                font-size: 24px;
                display: inline-block;
                line-height: 1;
                text-transform: none;
                letter-spacing: normal;
                word-wrap: normal;
                white-space: nowrap;
                direction: ltr;
                -webkit-font-smoothing: antialiased;
                text-rendering: optimizeLegibility;
                -moz-osx-font-smoothing: grayscale;
                font-feature-settings: "liga"
            }

            .material-icons-outlined {
                font-family: Material Symbols Rounded;
                font-weight: 400
            }

            .cursor-pointer {
                cursor: pointer!important
            }

            body {
                overflow-x: hidden
            }

            body::-webkit-scrollbar {
                display: none
            }

            li {
                padding: 12px
            }

            .btn-primary {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                font-family: inherit;
                font-size: 16px;
                font-weight: 700;
                line-height: 1.4;
                color: #1c1c1c;
                background: #32bf55;
                border: none;
                border-radius: 8px;
                padding: 12px 22px;
                cursor: pointer;
                text-decoration: none;
                transition: background .12s ease,transform .12s ease
            }

            .btn-primary:hover {
                background: #27a847;
                color: #1c1c1c;
                text-decoration: none
            }

            .btn-primary:active {
                background: #1d8a39;
                color: #fff;
                transform: scale(.97)
            }

            .btn-primary:focus-visible {
                outline: 3px solid #1d8a39;
                outline-offset: 3px
            }

            .btn-primary:disabled {
                opacity: .38;
                cursor: not-allowed
            }

            @media(max-width: 628px) {
                .max-\[628px\]\:\!w-\[90\%\] {
                    width:90%!important
                }
            }

            @media(min-width: 629px) {
                @media(max-width:1023px) {
                    .min-\[629px\]\:max-\[1023px\]\:\!w-\[45\%\] {
                        width:45%!important
                    }
                }
            }
        </style>
        <link rel="stylesheet" href="styles-MJ2SMNKV.css" crossorigin="anonymous" media="print" onload="this.media='all'">
        <noscript>
            <link rel="stylesheet" href="styles-MJ2SMNKV.css" crossorigin="anonymous">
        </noscript>
        <style ng-app-id="ng">
            .app-sidenav-drawer[_ngcontent-ng-c1414614956] {
                transition: width .3s ease
            }

            .app-sidenav-drawer.sidenav-collapsed[_ngcontent-ng-c1414614956] {
                width: 6%!important;
                min-width: 6%!important;
                max-width: 6%!important
            }

            .app-sidenav-drawer.sidenav-expanded[_ngcontent-ng-c1414614956] {
                width: 25%!important;
                min-width: 25%!important;
                max-width: 25%!important
            }

            @media(min-width: 1286px) {
                .app-sidenav-drawer.sidenav-collapsed[_ngcontent-ng-c1414614956] {
                    width:6%!important;
                    min-width: 6%!important;
                    max-width: 6%!important
                }

                .app-sidenav-drawer.sidenav-expanded[_ngcontent-ng-c1414614956] {
                    width: 20%;
                    min-width: 18%!important;
                    max-width: 18%!important
                }
            }

            #sidenav[_ngcontent-ng-c1414614956]::-webkit-scrollbar {
                width: 4px!important
            }

            #sidenav[_ngcontent-ng-c1414614956]::-webkit-scrollbar-track {
                background: transparent!important
            }

            #sidenav[_ngcontent-ng-c1414614956]::-webkit-scrollbar-thumb {
                background-color: #0000004d!important
            }
        </style>
        <style ng-app-id="ng">
            @keyframes _ngcontent-ng-c2212410423_fadeIn {
                0% {
                    opacity: 0
                }

                to {
                    opacity: 1
                }
            }

            @keyframes _ngcontent-ng-c2212410423_slideUp {
                0% {
                    opacity: 0;
                    transform: translateY(20px)
                }

                to {
                    opacity: 1;
                    transform: translateY(0)
                }
            }
        </style>
        <style ng-app-id="ng">
            [_nghost-ng-c749988996] {
                display: block;
                will-change: transform
            }
        </style>
        <style ng-app-id="ng">
            .default_icon[_ngcontent-ng-c116636336] {
                width: 28px;
                height: 28px
            }

            .language-chooser[_ngcontent-ng-c116636336] {
                color: #000;
                align-items: center;
                padding: 2%
            }

            .language-chooser-button[_ngcontent-ng-c116636336], .language-chooser-menu[_ngcontent-ng-c116636336] {
                position: relative;
                z-index: 0
            }

            .lang-trigger[_ngcontent-ng-c116636336] {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                color: inherit;
                font-family: inherit;
                font-weight: 600;
                font-size: 14px;
                padding: 8px 12px;
                border-radius: 10px;
                transition: background .15s
            }

            .lang-trigger[_ngcontent-ng-c116636336]:hover {
                background: #8080801f
            }

            .lang-trigger[_ngcontent-ng-c116636336] .lang-flag[_ngcontent-ng-c116636336] {
                width: 22px;
                height: 16px;
                border-radius: 3px;
                object-fit: cover;
                display: block
            }

            .lang-trigger[_ngcontent-ng-c116636336] .lang-code[_ngcontent-ng-c116636336] {
                line-height: 1
            }

            .lang-trigger[_ngcontent-ng-c116636336] .chev[_ngcontent-ng-c116636336] {
                font-size: 20px;
                opacity: .7
            }

            .lang-opt[_ngcontent-ng-c116636336] {
                display: inline-flex;
                align-items: center;
                gap: 10px
            }

            .lang-opt[_ngcontent-ng-c116636336] .lang-flag[_ngcontent-ng-c116636336] {
                width: 20px;
                height: 14px;
                border-radius: 3px;
                object-fit: cover;
                flex: 0 0 20px;
                box-shadow: 0 0 0 1px #00000026
            }
        </style>
        <style ng-app-id="ng">
            @charset "UTF-8";.zero-percent-text[_ngcontent-ng-c3822806064] {
                font-size: clamp(180px,22vw,320px);
                line-height: .85;
                font-weight: 700;
                color: #89e19f;
                font-family: Raleway,sans-serif;
                letter-spacing: -.02em
            }

            .zero-percent-text-mobile[_ngcontent-ng-c3822806064] {
                font-size: clamp(100px,30vw,180px);
                line-height: .85;
                font-weight: 700;
                color: #89e19f;
                font-family: Raleway,sans-serif
            }

            .calculator-result-row[_ngcontent-ng-c3822806064] {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #f0f0f0
            }

            .calculator-result-row[_ngcontent-ng-c3822806064]:last-child {
                border-bottom: none;
                font-weight: 600;
                font-size: 18px
            }
        </style>
        <meta name="description" content="Start a crowdfunding campaign or donate to a charity. WhyDonate is your platform for personal fundraising and supporting good causes globally.">
        <meta property="og:description" content="Start a crowdfunding campaign or donate to a charity. WhyDonate is your platform for personal fundraising and supporting good causes globally.">
        <meta name="twitter:description" content="Start a crowdfunding campaign or donate to a charity. WhyDonate is your platform for personal fundraising and supporting good causes globally.">
        <meta property="og:title" content="WhyDonate | Crowdfunding &amp; Online Fundraising Platform">
        <meta name="twitter:title" content="WhyDonate | Crowdfunding &amp; Online Fundraising Platform">
        <meta property="og:url" content="https://whydonate.com/">
        <link rel="canonical" href="https://whydonate.com/">
        <meta property="og:image" content="https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/shared/HomePersonalBanner/public">
        <meta property="og:image:secure_url" content="https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/shared/HomePersonalBanner/public">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="628">
        <meta property="og:image:type" content="image/jpeg">
        <meta name="twitter:image" content="https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/shared/HomePersonalBanner/public">
        <script id="ua-jsonld" type="application/ld+json">
            {
                "@context": "https://schema.org",
                "@graph": [
                    {
                        "@type": "WebPage",
                        "@id": "https://whydonate.com/#webpage",
                        "url": "https://whydonate.com/",
                        "name": "WhyDonate | Crowdfunding & Online Fundraising Platform",
                        "isPartOf": {
                            "@id": "https://whydonate.com/#website"
                        },
                        "about": {
                            "@id": "https://whydonate.com/#organization"
                        },
                        "description": "Start a crowdfunding campaign or donate to a charity. WhyDonate is your platform for personal fundraising and supporting good causes globally.",
                        "datePublished": "2026-08-17T08:55:45.484Z",
                        "dateModified": "2026-08-20T09:50:03.912Z",
                        "inLanguage": "en",
                        "breadcrumb": {
                            "@id": "https://whydonate.com/#breadcrumb"
                        }
                    },
                    {
                        "@type": "BreadcrumbList",
                        "@id": "https://whydonate.com/#breadcrumb",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Home",
                                "item": "https://whydonate.com/"
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": "WhyDonate | Crowdfunding & Online Fundraising Platform"
                            }
                        ]
                    }
                ]
            }</script>
        <meta name="keywords" content="crowdfunding, online fundraising, donate, charity, fundraiser, 0% platform fee">
        <meta name="robots" content="follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large">
        <meta property="og:type" content="website">
        <meta property="og:locale" content="en_GB">
        <meta property="og:site_name" content="WhyDonate">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@whydonate">
        <meta name="twitter:creator" content="@whydonate">
        <meta property="article:publisher" content="https://www.facebook.com/whydonate">
        <style ng-app-id="ng">
            [_nghost-ng-c1846917774] {
                display: block
            }
        </style>
        <style>
            @keyframes wd-pulse-ring {
                0%,to {
                    transform: scale(1);
                    opacity: 1
                }

                50% {
                    transform: scale(3);
                    opacity: 0
                }
            }

            .wd-home {
                --green: #2bae72;
                --green-dark: #1e8a57;
                --green-deep: #0f4a30;
                --green-darker: #0a2e1e;
                --green-soft: #e6f7ee;
                --green-tint: #f0faf3;
                --cream: #f7f2e8;
                --cream-warm: #f7f2e8;
                --cream-soft: #fbf7ef;
                --white: #ffffff;
                --amber: #f59e0b;
                --amber-soft: #fef3c7;
                --text: #1a1a14;
                --text-2: #3a3f36;
                --muted: #6e7566;
                --muted-2: #8b9485;
                --border: #e2edea;
                --border-soft: #eef3ef;
                --radius: 18px;
                --radius-lg: 24px;
                --shadow-soft: 0 6px 22px rgba(20, 40, 30, .06);
                --shadow-card: 0 14px 40px rgba(20, 40, 30, .08);
                --shadow-float: 0 20px 60px rgba(0, 0, 0, .15);
                --maxw: 1240px;
                display: block;
                font-family: Inter,Inter Fallback,system-ui,sans-serif;
                font-weight: 600;
                font-size: 17px;
                line-height: 1.55;
                color: var(--text);
                -webkit-font-smoothing: antialiased;
                text-rendering: optimizeLegibility;
                background: var(--white);
                color-scheme: light
            }

            .wd-home *,.wd-home *:before,.wd-home *:after {
                box-sizing: border-box
            }

            .wd-home img {
                max-width: 100%;
                display: block
            }

            .wd-home a {
                color: inherit;
                text-decoration: none
            }

            .wd-home p {
                margin: 0
            }

            .wd-home .msi {
                font-family: Material Symbols Rounded!important;
                font-weight: 400;
                font-style: normal;
                line-height: 1;
                letter-spacing: normal;
                text-transform: none;
                display: inline-block;
                white-space: nowrap;
                word-wrap: normal;
                direction: ltr;
                font-feature-settings: "liga";
                -webkit-font-smoothing: antialiased;
                vertical-align: middle;
                -webkit-user-select: none;
                user-select: none
            }

            .wd-home section {
                padding: 96px 0
            }

            .wd-home .container {
                max-width: var(--maxw);
                margin: 0 auto;
                padding: 0 28px
            }

            .wd-home .cream {
                background: var(--cream)
            }

            .wd-home .cream-warm {
                background: var(--cream-warm)
            }

            .wd-home .eyebrow {
                font-size: 13px;
                letter-spacing: .16em;
                text-transform: uppercase;
                color: var(--green-dark);
                font-weight: 800
            }

            .wd-home .btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 14px 22px;
                border-radius: 999px;
                font-weight: 800;
                font-size: 16px;
                transition: all .18s ease;
                white-space: nowrap;
                cursor: pointer
            }

            .wd-home .btn-primary {
                background: var(--green);
                color: #fff;
                box-shadow: 0 8px 20px #2bae7252
            }

            .wd-home .btn-primary:hover {
                background: var(--green-dark);
                transform: translateY(-1px);
                box-shadow: 0 12px 28px #2bae7266
            }

            .wd-home .btn-outline {
                border: 1.5px solid var(--border);
                background: #fff;
                color: var(--text)
            }

            .wd-home .btn-outline:hover {
                border-color: var(--green);
                color: var(--green-dark)
            }

            .wd-home .btn-white {
                background: #fff;
                color: var(--green-dark);
                box-shadow: 0 8px 24px #0000001f
            }

            .wd-home .btn-white:hover {
                transform: translateY(-1px)
            }

            .wd-home .section-head {
                max-width: 760px;
                margin: 0 auto 56px;
                text-align: center
            }

            .wd-home .section-head h2 {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 600;
                font-size: 50px;
                line-height: 1.07;
                letter-spacing: -.02em;
                margin: 14px 0
            }

            .wd-home .section-head h2 em {
                font-style: italic;
                color: var(--green-dark)
            }

            .wd-home .section-head .sub {
                color: var(--muted);
                font-size: 18px;
                font-weight: 600;
                max-width: 600px;
                margin: 0 auto
            }

            .wd-home .hero {
                padding: 64px 0 80px;
                position: relative;
                overflow: hidden;
                background: #fff
            }

            .wd-home .hero:before {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                background: radial-gradient(900px 500px at -10% 10%,rgba(43,174,114,.05),transparent 60%),radial-gradient(700px 500px at 110% 30%,rgba(59,130,246,.05),transparent 60%);
                pointer-events: none
            }

            .wd-home .hero h1 {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 600;
                font-size: 64px;
                line-height: 1.04;
                letter-spacing: -.025em;
                margin: 22px 0;
                color: var(--text)
            }

            .wd-home .hero h1 em {
                font-style: italic;
                color: var(--green-dark);
                font-weight: 600
            }

            .wd-home .hero-grid {
                display: grid;
                grid-template-columns: 1.05fr minmax(430px,1fr);
                gap: 64px;
                align-items: center;
                position: relative
            }

            .wd-home .hero-gallery {
                position: relative;
                align-self: stretch;
                margin-top: -64px;
                margin-bottom: -80px
            }

            .wd-home .hero-eyebrow {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: var(--green-soft);
                color: var(--green-dark);
                font-weight: 800;
                font-size: 13.5px;
                padding: 8px 14px;
                border-radius: 999px;
                border: 1px solid rgba(43,174,114,.15);
                white-space: nowrap
            }

            .wd-home .hero-eyebrow .eb-raised {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                color: var(--green-dark);
                white-space: nowrap
            }

            .wd-home .hero-eyebrow .eb-raised b {
                font-weight: 800
            }

            .wd-home .hero-eyebrow .pulse {
                position: relative;
                width: 8px;
                height: 8px;
                border-radius: 50%
            }

            .wd-home .hero-eyebrow .pulse:before,.wd-home .hero-eyebrow .pulse:after {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                border-radius: 50%
            }

            .wd-home .hero-eyebrow .pulse:before {
                background: #2bae728c;
                animation: wd-pulse-ring 1.8s ease-in-out infinite
            }

            .wd-home .hero-eyebrow .pulse:after {
                background: var(--green)
            }

            .wd-home .hero-sub {
                font-size: 19px;
                color: var(--text-2);
                max-width: 540px;
                font-weight: 600;
                line-height: 1.55
            }

            .wd-home .hero-sub strong {
                color: var(--text);
                font-weight: 800
            }

            .wd-home .hero-ctas {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 32px 0 28px;
                flex-wrap: wrap
            }

            .wd-home .hero-fee-note {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                margin-top: 18px;
                max-width: 480px;
                font-size: 13px;
                font-weight: 600;
                color: var(--muted);
                line-height: 1.5
            }

            .wd-home .hero-fee-note .msi {
                flex: 0 0 auto;
                font-size: 15px;
                color: var(--green-dark);
                margin-top: 1px
            }

            .wd-home .hero-fee-note strong {
                color: var(--text);
                font-weight: 800
            }

            .wd-home .hero-gallery .grid {
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 18px
            }

            .wd-home .hero-gallery .col {
                position: relative;
                overflow: hidden
            }

            .wd-home .hero-gallery .track {
                display: flex;
                flex-direction: column;
                gap: 18px;
                will-change: transform
            }

            .wd-home .hero-gallery .col-a .track {
                animation: wd-home-hero-up 40s linear infinite
            }

            .wd-home .hero-gallery .col-b .track {
                animation: wd-home-hero-down 40s linear infinite
            }

            .wd-home .hero-gallery .col:hover .track {
                animation-play-state: paused
            }

            .wd-home .hero-gallery .tile {
                flex: 0 0 auto;
                border-radius: 22px;
                overflow: hidden;
                background: #e7ece8;
                box-shadow: var(--shadow-card)
            }

            .wd-home .hero-gallery .tile img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block
            }

            .wd-home .hero-gallery .tile.hs {
                height: 180px
            }

            .wd-home .hero-gallery .tile.hm {
                height: 210px
            }

            .wd-home .hero-gallery .tile.hl {
                height: 250px
            }

            .wd-home .trustbar {
                border-top: 1px solid rgba(255,255,255,.06);
                background: var(--green-deep)
            }

            .wd-home .trustbar-inner {
                display: flex;
                align-items: stretch;
                justify-content: space-between;
                gap: 12px;
                padding: 22px 28px;
                max-width: var(--maxw);
                margin: 0 auto;
                flex-wrap: wrap
            }

            .wd-home .trust-item {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                flex: 1;
                min-width: 200px
            }

            .wd-home .trust-item .t-ico {
                flex: 0 0 42px;
                width: 42px;
                height: 42px;
                border-radius: 12px;
                background: #a7e8c624;
                color: #a7e8c6;
                display: grid;
                place-items: center
            }

            .wd-home .trust-item .t-ico .msi {
                font-size: 24px
            }

            .wd-home .trust-item .t-txt {
                display: flex;
                flex-direction: column;
                line-height: 1.25
            }

            .wd-home .trust-item .t-title {
                font-size: 15.5px;
                font-weight: 800;
                color: #fff;
                letter-spacing: -.01em;
                overflow-wrap: anywhere
            }

            .wd-home .trustbar .sep {
                width: 1px;
                align-self: stretch;
                background: #ffffff24;
                flex: 0 0 1px
            }

            @media(max-width: 980px) {
                .wd-home .trustbar .sep {
                    display:none
                }

                .wd-home .trustbar-inner {
                    flex-wrap: nowrap;
                    gap: 10px;
                    padding: 18px 20px
                }

                .wd-home .trust-item {
                    flex: 1 1 0;
                    min-width: 0;
                    flex-direction: column;
                    justify-content: flex-start;
                    text-align: center;
                    gap: 8px
                }

                .wd-home .trust-item .t-title {
                    font-size: 12.5px;
                    line-height: 1.3
                }
            }

            @media(max-width: 640px) {
                .wd-home .trustbar-inner {
                    gap:8px;
                    padding: 14px 12px
                }

                .wd-home .trust-item {
                    gap: 6px
                }

                .wd-home .trust-item .t-ico {
                    flex: 0 0 30px;
                    width: 30px;
                    height: 30px;
                    border-radius: 9px
                }

                .wd-home .trust-item .t-ico .msi {
                    font-size: 18px
                }

                .wd-home .trust-item .t-title {
                    font-size: 11px;
                    line-height: 1.25;
                    letter-spacing: 0;
                    text-wrap: balance
                }
            }

            .wd-home .home-fundraisers .eyebrow {
                display: inline-flex;
                align-items: center;
                gap: 8px
            }

            .wd-home .home-fundraisers .pulse {
                position: relative;
                width: 8px;
                height: 8px;
                border-radius: 50%
            }

            .wd-home .home-fundraisers .pulse:before,.wd-home .home-fundraisers .pulse:after {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                border-radius: 50%
            }

            .wd-home .home-fundraisers .pulse:before {
                background: #2bae728c;
                animation: wd-pulse-ring 1.8s ease-in-out infinite
            }

            .wd-home .home-fundraisers .pulse:after {
                background: var(--green)
            }

            .wd-home .tabs {
                display: flex;
                justify-content: center;
                gap: 6px;
                flex-wrap: wrap;
                margin-bottom: 40px
            }

            .wd-home .tab {
                padding: 10px 18px;
                border-radius: 999px;
                font-weight: 800;
                font-size: 14.5px;
                color: var(--muted);
                background: transparent;
                border: 1px solid transparent;
                cursor: pointer;
                font-family: inherit
            }

            .wd-home .tab.active {
                background: #fff;
                color: var(--green-dark);
                border-color: var(--border)
            }

            .wd-home .tab:not(.active):hover {
                color: var(--text)
            }

            .wd-home .cards3 {
                display: grid;
                grid-template-columns: repeat(3,1fr);
                gap: 24px
            }

            .wd-home .camp {
                background: #fff;
                border-radius: 22px;
                overflow: hidden;
                border: 1px solid var(--border-soft);
                transition: transform .2s,box-shadow .2s;
                display: flex;
                flex-direction: column
            }

            .wd-home .camp:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-card)
            }

            .wd-home .camp:hover .camp-img img {
                transform: scale(1.04)
            }

            .wd-home .camp h3 {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 600;
                font-size: 19px;
                line-height: 1.25;
                margin-bottom: 6px;
                min-height: 46px
            }

            .wd-home .camp-img {
                position: relative;
                height: 210px;
                overflow: hidden;
                background: #e7ece8
            }

            .wd-home .camp-img img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform .35s
            }

            .wd-home .camp-tag {
                position: absolute;
                top: 14px;
                left: 14px;
                background: #ffffffeb;
                font-size: 11.5px;
                font-weight: 800;
                letter-spacing: .06em;
                text-transform: uppercase;
                color: var(--text);
                padding: 5px 10px;
                border-radius: 999px;
                -webkit-backdrop-filter: blur(4px);
                backdrop-filter: blur(4px)
            }

            .wd-home .camp-body {
                padding: 18px 20px 22px;
                display: flex;
                flex-direction: column;
                flex: 1
            }

            .wd-home .camp-org {
                font-size: 13px;
                color: var(--muted);
                font-weight: 700;
                margin-bottom: 16px
            }

            .wd-home .progress {
                height: 8px;
                background: var(--border-soft);
                border-radius: 999px;
                overflow: hidden;
                margin-bottom: 10px
            }

            .wd-home .progress .fill {
                height: 100%;
                background: linear-gradient(90deg,var(--green),var(--green-dark));
                border-radius: 999px
            }

            .wd-home .camp-stats {
                display: flex;
                justify-content: space-between;
                gap: 8px;
                font-size: 13px;
                color: var(--muted);
                font-weight: 700;
                margin-top: auto
            }

            .wd-home .camp-stats b {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 700;
                font-size: 16px;
                color: var(--text);
                display: block;
                letter-spacing: -.01em
            }

            .wd-home .camp-stats .sm {
                display: flex;
                flex-direction: column;
                gap: 1px;
                align-items: flex-start
            }

            .wd-home .camp-stats .sm.right {
                align-items: flex-end
            }

            .wd-home .center-btn {
                display: flex;
                justify-content: center;
                margin-top: 40px
            }

            @media(max-width: 980px) {
                .wd-home .cards3 {
                    grid-template-columns:1fr
                }
            }

            @media(min-width: 641px)and (max-width:980px) {
                .wd-home .cards3 {
                    grid-template-columns:1fr 1fr
                }
            }

            @media(max-width: 640px) {
                .wd-home .tab {
                    min-height:44px
                }
            }

            .wd-home .how {
                background: var(--green);
                color: #fff;
                padding: 96px 0;
                position: relative;
                overflow: hidden
            }

            .wd-home .how .section-head {
                margin: 0 auto 8px;
                max-width: 680px
            }

            .wd-home .how .section-head h2,.wd-home .how .section-head h2 em {
                color: #fff
            }

            .wd-home .how .section-head .sub {
                color: #ffffffe6;
                margin: 0 auto
            }

            .wd-home .how .eyebrow {
                color: #ffffffd9
            }

            .wd-home .how-stepper {
                display: grid;
                grid-template-columns: 1fr 1.04fr;
                gap: 52px;
                align-items: center;
                margin-top: 56px
            }

            .wd-home .hs-list {
                display: flex;
                flex-direction: column;
                gap: 8px
            }

            .wd-home .hs-step {
                position: relative;
                display: grid;
                grid-template-columns: auto 1fr;
                gap: 15px;
                align-items: start;
                text-align: left;
                width: 100%;
                background: transparent;
                border: 1px solid transparent;
                border-radius: 18px;
                padding: 17px 20px 24px;
                cursor: pointer;
                color: #fff;
                opacity: .58;
                transition: background .35s,border-color .35s,opacity .35s;
                font-family: inherit
            }

            .wd-home .hs-step:hover {
                opacity: .82
            }

            .wd-home .hs-step.active {
                opacity: 1;
                background: #ffffff1a;
                border-color: #ffffff2e
            }

            .wd-home .hs-ico {
                width: 46px;
                height: 46px;
                border-radius: 13px;
                display: grid;
                place-items: center;
                background: #ffffff24;
                color: #fff;
                flex: 0 0 auto;
                transition: background .35s,color .35s
            }

            .wd-home .hs-ico .msi {
                font-size: 23px
            }

            .wd-home .hs-step.active .hs-ico {
                background: #fff;
                color: var(--green-dark)
            }

            .wd-home .hs-txt h3 {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 600;
                font-size: 21px;
                line-height: 1.15;
                letter-spacing: -.01em;
                color: #fff;
                margin: 3px 0 4px
            }

            .wd-home .hs-txt p {
                font-size: 14px;
                line-height: 1.5;
                color: #fff;
                font-weight: 600;
                margin: 0;
                max-height: 0;
                opacity: 0;
                overflow: hidden;
                transition: max-height .45s cubic-bezier(.22,.61,.36,1),opacity .3s,margin .45s
            }

            .wd-home .hs-step.active .hs-txt p,.wd-home .hs-step:focus-visible .hs-txt p {
                max-height: 11em;
                opacity: 1;
                margin-top: 4px
            }

            .wd-home .hs-prog {
                position: absolute;
                left: 20px;
                right: 20px;
                bottom: 11px;
                height: 3px;
                border-radius: 2px;
                background: #ffffff38;
                overflow: hidden;
                opacity: 0;
                transition: opacity .3s
            }

            .wd-home .hs-step.active .hs-prog {
                opacity: 1
            }

            .wd-home .hs-fill {
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 100%;
                transform: scaleX(0);
                transform-origin: left center;
                background: var(--amber);
                border-radius: 2px
            }

            .wd-home .hs-step.active .hs-fill {
                animation: wd-home-hs-fill linear both
            }

            .wd-home .hs-stage {
                position: relative;
                width: 300px;
                max-width: 100%;
                margin: 0 auto;
                padding: 13px;
                background: linear-gradient(160deg,#12351f,#0a2e1e);
                border-radius: 44px;
                box-shadow: 0 30px 70px #00000052,inset 0 0 0 2px #ffffff0f
            }

            .wd-home .hs-stage:before {
                content: "";
                position: absolute;
                top: 13px;
                left: 50%;
                transform: translate(-50%);
                width: 116px;
                height: 24px;
                background: #0a2e1e;
                border-radius: 0 0 16px 16px;
                z-index: 6
            }

            .wd-home .hs-card {
                position: relative;
                height: 544px;
                background: #fff;
                border-radius: 32px;
                overflow: hidden
            }

            .wd-home .hs-status {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 38px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 22px;
                font-size: 12px;
                font-weight: 800;
                color: var(--text);
                z-index: 5
            }

            .wd-home .hs-status .msi {
                font-size: 15px
            }

            .wd-home .hs-status .st-r {
                display: inline-flex;
                align-items: center;
                gap: 5px
            }

            .wd-home .hs-panel {
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                padding: 46px 20px 22px;
                display: flex;
                flex-direction: column;
                opacity: 0;
                transform: translateY(10px) scale(.992);
                transition: opacity .5s,transform .5s;
                pointer-events: none;
                color: var(--text)
            }

            .wd-home .hs-panel>* {
                opacity: 0
            }

            .wd-home .hs-panel.active {
                opacity: 1;
                transform: none;
                pointer-events: auto
            }

            .wd-home .hs-panel.active>* {
                animation: wd-home-hs-up .55s both
            }

            .wd-home .hs-panel.active>*:nth-child(1) {
                animation-delay: .02s
            }

            .wd-home .hs-panel.active>*:nth-child(2) {
                animation-delay: .1s
            }

            .wd-home .hs-panel.active>*:nth-child(3) {
                animation-delay: .18s
            }

            .wd-home .hs-panel.active>*:nth-child(4) {
                animation-delay: .26s
            }

            .wd-home .hs-panel.active>*:nth-child(5) {
                animation-delay: .34s
            }

            .wd-home .hs-panel.active>*:nth-child(6) {
                animation-delay: .42s
            }

            .wd-home .hs-phead {
                display: flex;
                align-items: center;
                gap: 9px;
                font-weight: 800;
                font-size: 12.5px;
                color: var(--muted);
                letter-spacing: .02em;
                text-transform: uppercase;
                margin-bottom: 16px
            }

            .wd-home .hs-phead .msi {
                font-size: 18px;
                color: var(--green-dark)
            }

            .wd-home .hs-btn {
                margin-top: auto;
                background: var(--green);
                color: #fff;
                border-radius: 12px;
                padding: 13px;
                font-weight: 800;
                font-size: 14.5px;
                text-align: center;
                box-shadow: 0 8px 20px #2bae7247
            }

            .wd-home .hs-cover {
                position: relative;
                height: 132px;
                border-radius: 14px;
                overflow: hidden;
                background: #e7ece8
            }

            .wd-home .hs-cover img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block
            }

            .wd-home .hs-cover-up {
                position: absolute;
                left: 10px;
                bottom: 10px;
                background: #107848eb;
                color: #fff;
                font-size: 11px;
                font-weight: 800;
                padding: 5px 10px;
                border-radius: 8px;
                display: inline-flex;
                align-items: center;
                gap: 5px
            }

            .wd-home .hs-cover-up .msi {
                font-size: 14px
            }

            .wd-home .hs-cat {
                display: flex;
                gap: 8px;
                margin-top: 12px;
                flex-wrap: wrap
            }

            .wd-home .hs-cat-chip {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: #f1f5f2;
                border: 1px solid var(--border-soft);
                border-radius: 999px;
                padding: 7px 13px;
                font-size: 12.5px;
                font-weight: 800;
                color: var(--text-2)
            }

            .wd-home .hs-cat-chip .msi {
                font-size: 15px
            }

            .wd-home .hs-cat-chip.on {
                background: var(--green-soft);
                border-color: transparent;
                color: var(--green-dark)
            }

            .wd-home .hs-input2 {
                margin-top: 12px;
                background: #f4f7f5;
                border: 1.5px solid var(--green);
                border-radius: 11px;
                padding: 11px 14px;
                display: flex;
                flex-direction: column;
                gap: 3px
            }

            .wd-home .hs-input2 .hs-lbl {
                color: var(--muted);
                font-weight: 800;
                font-size: 10.5px;
                text-transform: uppercase;
                letter-spacing: .05em
            }

            .wd-home .hs-typed {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 600;
                font-size: 19px;
                color: var(--text);
                display: inline-flex;
                align-items: center;
                line-height: 1.2
            }

            .wd-home .hs-caret {
                display: inline-block;
                width: 2px;
                height: 19px;
                background: var(--green);
                margin-left: 2px;
                animation: wd-home-hs-blink 1s step-end infinite
            }

            .wd-home .hs-linkrow {
                display: flex;
                align-items: center;
                gap: 10px;
                background: #f4f6f4;
                border-radius: 11px;
                padding: 6px 6px 6px 14px;
                margin-bottom: 12px
            }

            .wd-home .hs-link {
                flex: 1;
                font-weight: 700;
                font-size: 13px;
                color: var(--text-2);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis
            }

            .wd-home .hs-copy {
                background: var(--green);
                color: #fff;
                border-radius: 8px;
                padding: 9px 14px;
                font-weight: 800;
                font-size: 12.5px
            }

            .wd-home .hs-copied {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                color: var(--green-dark);
                font-weight: 800;
                font-size: 12.5px;
                margin-bottom: 15px
            }

            .wd-home .hs-copied .msi {
                font-size: 17px
            }

            .wd-home .hs-chips {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px
            }

            .wd-home .hs-chip {
                display: flex;
                align-items: center;
                gap: 7px;
                background: #fff;
                border: 1px solid var(--border-soft);
                border-radius: 11px;
                padding: 10px 11px;
                font-weight: 700;
                font-size: 12.5px;
                color: var(--text);
                min-width: 0
            }

            .wd-home .hs-chip .msi {
                font-size: 16px;
                color: var(--green-dark);
                flex: none
            }

            .wd-home .hs-chip svg {
                width: 16px;
                height: 16px;
                flex: none;
                display: block;
                object-fit: contain
            }

            .wd-home .hs-raise {
                display: flex;
                align-items: baseline;
                gap: 8px;
                margin-bottom: 12px
            }

            .wd-home .hs-raise .hs-amt {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 700;
                font-size: 34px;
                color: var(--text);
                line-height: 1
            }

            .wd-home .hs-raise span {
                color: var(--muted);
                font-weight: 700;
                font-size: 13px
            }

            .wd-home .hs-track {
                height: 10px;
                border-radius: 6px;
                background: #eaf0ec;
                overflow: hidden;
                margin-bottom: 12px
            }

            .wd-home .hs-trackfill {
                display: block;
                height: 100%;
                width: 0;
                background: linear-gradient(90deg,var(--green),var(--green-dark));
                border-radius: 6px
            }

            .wd-home .hs-meta {
                display: flex;
                justify-content: space-between;
                font-size: 12.5px;
                color: var(--muted);
                font-weight: 700;
                margin-bottom: 15px
            }

            .wd-home .hs-donors {
                display: flex;
                flex-direction: column;
                gap: 9px
            }

            .wd-home .hs-donor {
                display: flex;
                align-items: center;
                gap: 11px;
                background: #f4f7f5;
                border-radius: 12px;
                padding: 9px 12px;
                font-size: 13px;
                color: var(--text-2);
                font-weight: 600
            }

            .wd-home .hs-donor span {
                flex: 1
            }

            .wd-home .hs-donor .hs-amt2 {
                color: var(--green-dark);
                font-weight: 800
            }

            .wd-home .hs-payout {
                background: linear-gradient(135deg,var(--green-tint),#fff);
                border: 1px solid var(--border-soft);
                border-radius: 16px;
                padding: 20px;
                text-align: center;
                margin-bottom: 13px
            }

            .wd-home .hs-payout b {
                display: block;
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 700;
                font-size: 22px;
                color: var(--text)
            }

            .wd-home .hs-payout>span {
                color: var(--muted);
                font-weight: 700;
                font-size: 12.5px
            }

            .wd-home .hs-check {
                width: 52px;
                height: 52px;
                border-radius: 50%;
                background: var(--green);
                color: #fff;
                display: grid;
                place-items: center;
                margin: 0 auto 12px
            }

            .wd-home .hs-check .msi {
                font-size: 30px;
                font-weight: 700
            }

            .wd-home .hs-opt {
                display: flex;
                align-items: center;
                gap: 12px;
                background: #f7f9f8;
                border-radius: 12px;
                padding: 11px 14px;
                margin-bottom: 9px
            }

            .wd-home .hs-opt>.msi {
                font-size: 21px;
                color: var(--green-dark)
            }

            .wd-home .hs-opt div {
                flex: 1
            }

            .wd-home .hs-opt b {
                display: block;
                font-size: 13.5px;
                color: var(--text);
                font-weight: 800
            }

            .wd-home .hs-opt div span {
                font-size: 11.5px;
                color: var(--muted);
                font-weight: 600
            }

            .wd-home .hs-toggle {
                width: 38px;
                height: 22px;
                border-radius: 999px;
                background: #d6deda;
                position: relative;
                flex: 0 0 auto
            }

            .wd-home .hs-toggle:after {
                content: "";
                position: absolute;
                top: 3px;
                left: 3px;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #fff
            }

            .wd-home .hs-toggle.on {
                background: var(--green)
            }

            .wd-home .hs-toggle.on:after {
                left: 19px
            }

            .wd-home .hs-feenote {
                display: flex;
                align-items: center;
                gap: 7px;
                color: var(--green-dark);
                font-weight: 800;
                font-size: 12px;
                margin-top: auto
            }

            .wd-home .hs-feenote .msi {
                font-size: 16px
            }

            .wd-home .hs-mail {
                background: #fff;
                border: 1px solid var(--border-soft);
                border-radius: 14px;
                box-shadow: var(--shadow-soft);
                overflow: hidden;
                margin-bottom: 16px
            }

            .wd-home .hs-mailhead {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 14px;
                border-bottom: 1px solid var(--border-soft)
            }

            .wd-home .hs-mailto {
                font-weight: 800;
                font-size: 12.5px;
                color: var(--text)
            }

            .wd-home .hs-sent {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: var(--green-soft);
                color: var(--green-dark);
                font-weight: 800;
                font-size: 11px;
                padding: 4px 9px;
                border-radius: 999px
            }

            .wd-home .hs-sent .msi {
                font-size: 14px
            }

            .wd-home .hs-subject {
                padding: 13px 14px 4px;
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 600;
                font-size: 16.5px;
                color: var(--text);
                line-height: 1.25
            }

            .wd-home .hs-mailbody {
                padding: 4px 14px 16px;
                font-size: 12.5px;
                color: var(--text-2);
                font-weight: 600;
                line-height: 1.55
            }

            .wd-home .hs-hearts {
                position: static
            }

            .wd-home .hs-heart {
                position: absolute;
                bottom: 66px;
                color: var(--green)
            }

            .wd-home .hs-heart .msi {
                font-size: 22px
            }

            @media(min-width: 981px) {
                .wd-home .how-stepper {
                    grid-template-columns:minmax(0,480px) 330px;
                    justify-content: center;
                    gap: 88px;
                    align-items: center;
                    margin-top: 48px
                }

                .wd-home .hs-list {
                    flex-direction: column;
                    align-items: stretch;
                    justify-content: flex-start;
                    gap: 6px;
                    width: 100%;
                    max-width: none
                }

                .wd-home .hs-step {
                    flex: none;
                    display: grid;
                    grid-template-columns: auto 1fr;
                    align-items: center;
                    text-align: left;
                    gap: 14px;
                    padding: 14px 18px 18px
                }

                .wd-home .hs-step.active {
                    align-items: start;
                    padding-bottom: 24px
                }

                .wd-home .hs-txt h3 {
                    font-size: 18.5px;
                    margin: 0
                }

                .wd-home .hs-txt p {
                    font-size: 14px;
                    max-width: 34em
                }

                .wd-home .hs-prog {
                    left: 18px;
                    right: 18px;
                    bottom: 10px
                }

                .wd-home .hs-stage {
                    width: 330px
                }
            }

            @media(max-width: 980px) {
                .wd-home .how-stepper {
                    grid-template-columns:1fr 300px;
                    gap: 26px;
                    margin-top: 34px;
                    align-items: center
                }

                .wd-home .hs-list {
                    flex-direction: column;
                    gap: 7px;
                    max-width: none;
                    margin: 0;
                    width: 100%
                }

                .wd-home .hs-step {
                    display: grid;
                    grid-template-columns: auto 1fr;
                    align-items: start;
                    text-align: left;
                    gap: 12px;
                    padding: 13px 14px 19px;
                    border-radius: 14px
                }

                .wd-home .hs-step .hs-ico {
                    width: 36px;
                    height: 36px;
                    border-radius: 11px
                }

                .wd-home .hs-step .hs-ico .msi {
                    font-size: 19px
                }

                .wd-home .hs-txt h3 {
                    font-size: 15px;
                    line-height: 1.2;
                    margin: 1px 0 3px
                }

                .wd-home .hs-txt p {
                    display: block;
                    font-size: 12.5px;
                    line-height: 1.4;
                    color: #ffffffe6
                }

                .wd-home .hs-prog {
                    left: 14px;
                    right: 14px;
                    bottom: 8px
                }
            }

            @media(max-width: 640px) {
                .wd-home .how-stepper {
                    grid-template-columns:1fr;
                    gap: 22px
                }

                .wd-home .hs-list {
                    gap: 6px
                }

                .wd-home .hs-step {
                    align-items: center;
                    padding: 12px 14px;
                    min-height: 60px
                }

                .wd-home .hs-step.active {
                    padding-bottom: 20px;
                    align-items: start
                }

                .wd-home .hs-txt h3 {
                    font-size: 14.5px;
                    margin: 0
                }

                .wd-home .hs-txt p {
                    font-size: 12.5px;
                    line-height: 1.45
                }

                .wd-home .hs-chip {
                    font-size: 11.5px;
                    padding: 9px 10px;
                    gap: 6px
                }
            }

            .wd-home .ftopics {
                display: grid;
                grid-template-columns: repeat(3,1fr);
                gap: 24px
            }

            .wd-home .ftopic {
                background: #fff;
                border: 1px solid var(--border);
                border-radius: 20px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transition: transform .2s,box-shadow .2s
            }

            .wd-home .ftopic:hover {
                transform: translateY(-4px);
                box-shadow: 0 18px 40px #14281e1a
            }

            .wd-home .ftopic:hover .ftopic-img img {
                transform: scale(1.05)
            }

            .wd-home .ftopic-img {
                position: relative;
                height: 200px;
                overflow: hidden
            }

            .wd-home .ftopic-img img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform .4s
            }

            .wd-home .ftopic-badge {
                position: absolute;
                top: 14px;
                left: 14px;
                z-index: 1;
                background: #fffffff2;
                color: var(--green-dark);
                font-weight: 800;
                font-size: 12px;
                padding: 6px 12px;
                border-radius: 999px;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                -webkit-backdrop-filter: blur(4px);
                backdrop-filter: blur(4px)
            }

            .wd-home .ftopic-badge .d {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--green);
                display: inline-block
            }

            .wd-home .ftopic-body {
                padding: 24px;
                display: flex;
                flex-direction: column;
                flex: 1
            }

            .wd-home .ftopic-body h3 {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 700;
                font-size: 22px;
                letter-spacing: -.01em;
                color: var(--text);
                margin-bottom: 10px
            }

            .wd-home .ftopic-body p {
                color: var(--muted);
                font-size: 15px;
                line-height: 1.55;
                font-weight: 600;
                margin-bottom: 18px;
                flex: 1
            }

            .wd-home .ftopic-link {
                color: var(--green-dark);
                font-weight: 800;
                font-size: 14.5px;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: gap .15s
            }

            .wd-home .ftopic-link:hover {
                gap: 9px
            }

            .wd-home .feats {
                display: grid;
                grid-template-columns: repeat(3,1fr);
                gap: 20px
            }

            .wd-home .feat {
                background: #fff;
                border: 1px solid var(--border-soft);
                border-radius: 20px;
                padding: 28px 26px;
                position: relative;
                overflow: hidden
            }

            .wd-home .feat .fi {
                width: 48px;
                height: 48px;
                border-radius: 13px;
                display: grid;
                place-items: center;
                margin-bottom: 18px;
                background: var(--green-soft);
                color: var(--green-dark)
            }

            .wd-home .feat .fi .msi {
                font-size: 24px
            }

            .wd-home .feat h3 {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 600;
                font-size: 22px;
                letter-spacing: -.01em;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap
            }

            .wd-home .feat p {
                color: var(--muted);
                font-size: 15px;
                line-height: 1.55;
                font-weight: 600
            }

            .wd-home .feat-link {
                color: var(--green-dark);
                font-weight: 800;
                text-decoration: underline;
                text-underline-offset: 2px
            }

            .wd-home .feat-link:hover {
                color: var(--green-deep)
            }

            .wd-home .trust-dark {
                background: var(--green-darker);
                color: #e7f1eb;
                padding: 96px 0;
                position: relative;
                overflow: hidden
            }

            .wd-home .trust-dark .container {
                position: relative;
                z-index: 1
            }

            .wd-home .trust-dark .eyebrow {
                color: #a7e8c6
            }

            .wd-home .trust-dark h2 {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 600;
                font-size: 46px;
                line-height: 1.07;
                color: #fff;
                margin: 14px 0 24px
            }

            .wd-home .trust-dark h2 em {
                font-style: italic;
                color: #a7e8c6
            }

            .wd-home .trust-dark .sub {
                color: #e7f1ebb8
            }

            .wd-home .td2-top {
                margin-bottom: 8px
            }

            .wd-home .td2-head {
                max-width: 720px;
                margin: 0 auto 30px;
                text-align: center
            }

            .wd-home .td2-head .sub {
                margin: 0 auto 24px;
                max-width: 620px
            }

            .wd-home .td2-pills {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                justify-content: center
            }

            .wd-home .td2-pill {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                background: #ffffff0d;
                border: 1px solid rgba(255,255,255,.12);
                border-radius: 999px;
                padding: 8px 14px;
                font-size: 13px;
                font-weight: 700;
                color: #d7e8dc
            }

            .wd-home .td2-pill .msi {
                font-size: 16px;
                color: #a7e8c6
            }

            .wd-home .td2-card {
                background: #ffffff0d;
                border: 1px solid rgba(255,255,255,.1);
                border-radius: 22px;
                padding: 30px 32px;
                -webkit-backdrop-filter: blur(6px);
                backdrop-filter: blur(6px)
            }

            .wd-home .td2-stats {
                display: grid;
                grid-template-columns: repeat(3,1fr);
                gap: 10px;
                padding-bottom: 24px;
                margin-bottom: 24px;
                border-bottom: 1px solid rgba(255,255,255,.12)
            }

            .wd-home .td2-stat {
                text-align: center
            }

            .wd-home .td2-stat .n {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 700;
                font-size: 31px;
                line-height: 1;
                color: #fff;
                letter-spacing: -.02em
            }

            .wd-home .td2-stat .l {
                font-size: 12px;
                font-weight: 700;
                color: #ffffff9e;
                margin-top: 9px;
                line-height: 1.3
            }

            .wd-home .dark-testis-head {
                display: flex;
                align-items: center;
                gap: 18px;
                margin-top: 64px;
                padding-top: 8px;
                flex-wrap: wrap
            }

            .wd-home .dark-testis-head .lbl {
                font-size: 12px;
                font-weight: 800;
                letter-spacing: .12em;
                text-transform: uppercase;
                color: #a7e8c6;
                white-space: nowrap
            }

            .wd-home .dark-testis-head .ln {
                flex: 1;
                height: 1px;
                background: #ffffff24
            }

            .wd-home .dark-testis-head .td2-ratings {
                gap: 10px;
                flex: 0 0 auto;
                justify-content: flex-end
            }

            .wd-home .dark-testis-head .rating {
                min-width: 0;
                flex-direction: row;
                align-items: center;
                gap: 11px;
                padding: 9px 14px;
                border-radius: 12px
            }

            .wd-home .dark-testis-head .rating .v {
                font-size: 16px
            }

            .wd-home .td2-ratings {
                display: flex;
                justify-content: center;
                gap: 14px;
                flex-wrap: wrap
            }

            .wd-home .td2-ratings .rating {
                min-width: 190px
            }

            .wd-home .rating {
                background: #ffffff0f;
                border: 1px solid rgba(255,255,255,.1);
                border-radius: 14px;
                padding: 12px 16px;
                display: flex;
                flex-direction: column;
                gap: 2px;
                transition: background .15s,border-color .15s,transform .15s;
                text-decoration: none
            }

            .wd-home .rating .src {
                font-size: 11.5px;
                color: #a7e8c6;
                font-weight: 800;
                letter-spacing: .06em;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                gap: 5px
            }

            .wd-home .rating .src .msi {
                font-size: 13px
            }

            .wd-home .rating .v {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 700;
                font-size: 18px;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 8px
            }

            .wd-home .rating .v .stars {
                color: #ffb200;
                font-size: 13px;
                letter-spacing: 1px
            }

            .wd-home .dark-testis {
                display: grid;
                grid-auto-flow: column;
                grid-auto-columns: calc((100% - 40px) / 3);
                gap: 20px;
                margin-top: 32px;
                overflow-x: auto;
                overflow-y: hidden;
                scroll-snap-type: x mandatory;
                scrollbar-width: none;
                -ms-overflow-style: none;
                padding: 6px 2px 10px
            }

            .wd-home .dark-testis::-webkit-scrollbar {
                display: none
            }

            .wd-home .dark-testi {
                background: #ffffff0d;
                border: 1px solid rgba(255,255,255,.1);
                border-radius: 18px;
                padding: 28px;
                position: relative;
                overflow: hidden;
                scroll-snap-align: start;
                display: flex;
                flex-direction: column;
                transition: transform .16s ease,border-color .16s ease,background .16s ease
            }

            .wd-home .dark-testi:before {
                content: "\201c";
                position: absolute;
                top: 0;
                right: 20px;
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-size: 76px;
                line-height: 1;
                color: #a7e8c629;
                pointer-events: none
            }

            .wd-home .dark-testi:hover {
                transform: translateY(-3px);
                border-color: #a7e8c659;
                background: #ffffff12
            }

            .wd-home .dark-testi .dt-top {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
                margin-bottom: 12px
            }

            .wd-home .dark-testi .stars {
                color: #ffb200;
                letter-spacing: 2px;
                font-size: 14px
            }

            .wd-home .dark-testi .dt-title {
                font-size: 15.5px;
                font-weight: 800;
                color: #fff;
                margin: 0 0 8px;
                letter-spacing: -.01em;
                position: relative;
                z-index: 1
            }

            .wd-home .dark-testi blockquote {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-style: italic;
                font-weight: 500;
                font-size: 17px;
                line-height: 1.5;
                color: #fff;
                margin: 0 0 20px;
                letter-spacing: -.005em;
                position: relative;
                z-index: 1;
                display: -webkit-box;
                -webkit-line-clamp: 9;
                -webkit-box-orient: vertical;
                overflow: hidden
            }

            .wd-home .dark-testi .dt-foot {
                margin-top: auto;
                padding-top: 18px;
                border-top: 1px solid rgba(255,255,255,.09);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 14px;
                flex-wrap: wrap
            }

            .wd-home .dark-testi .dt-link {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                font-size: 12.5px;
                font-weight: 800;
                color: #a7e8c6;
                white-space: nowrap;
                text-decoration: none
            }

            .wd-home .dark-testi .dt-link:hover {
                color: #fff
            }

            .wd-home .dark-testi .dt-link .msi {
                font-size: 14px
            }

            .wd-home .dark-testi .who {
                display: flex;
                align-items: center;
                gap: 12px
            }

            .wd-home .dark-testi .who .av {
                width: 38px;
                height: 38px;
                border-radius: 50%;
                flex: 0 0 38px;
                display: grid;
                place-items: center;
                background: #a7e8c629;
                border: 1px solid rgba(167,232,198,.28);
                color: #a7e8c6;
                font-weight: 800;
                font-size: 15px
            }

            .wd-home .dark-testi .who .n {
                font-weight: 800;
                font-size: 14.5px;
                color: #fff
            }

            .wd-home .dark-testi .who .r {
                font-size: 12.5px;
                color: #a7e8c6;
                font-weight: 700
            }

            .wd-home .trust-review-cta {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin-top: 44px;
                padding-top: 28px;
                font-size: 15px;
                font-weight: 700;
                color: #fffc;
                flex-wrap: wrap
            }

            .wd-home .trust-review-cta a {
                color: #a7e8c6;
                font-weight: 800;
                display: inline-flex;
                align-items: center;
                gap: 6px
            }

            .wd-home .trust-review-cta a:hover {
                color: #fff
            }

            .wd-home .final {
                background: var(--green-darker);
                color: #fff;
                position: relative;
                overflow: hidden;
                padding: 88px 0
            }

            .wd-home .final:before {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                background-image: radial-gradient(circle,rgba(255,255,255,.1) 1.1px,transparent 1.1px);
                background-size: 24px 24px;
                opacity: .6
            }

            .wd-home .final:after {
                content: "";
                position: absolute;
                top: -30%;
                right: -10%;
                width: 620px;
                height: 620px;
                border-radius: 50%;
                background: radial-gradient(circle,rgba(43,174,114,.55),transparent 68%);
                pointer-events: none
            }

            .wd-home .final h2 {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 600;
                font-size: clamp(36px,4.4vw,56px);
                line-height: 1.05;
                letter-spacing: -.02em;
                margin: 0 0 18px
            }

            .wd-home .final h2 em {
                font-style: italic;
                color: #a7e8c6;
                font-weight: 500
            }

            .wd-home .final p {
                font-size: 17px;
                font-weight: 500;
                opacity: .9;
                margin: 0 auto 30px;
                max-width: 520px
            }

            .wd-home .final-content {
                position: relative;
                max-width: 760px;
                margin: 0 auto;
                padding: 0 28px;
                text-align: center
            }

            .wd-home .final-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: #ffffff1a;
                border: 1px solid rgba(255,255,255,.2);
                padding: 7px 14px;
                border-radius: 999px;
                font-size: 13px;
                font-weight: 700;
                color: #fff;
                margin-bottom: 22px
            }

            .wd-home .final-badge .dot {
                position: relative;
                width: 8px;
                height: 8px;
                border-radius: 50%
            }

            .wd-home .final-badge .dot:before,.wd-home .final-badge .dot:after {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                border-radius: 50%
            }

            .wd-home .final-badge .dot:before {
                background: #2bae728c;
                animation: wd-pulse-ring 1.6s ease-in-out infinite
            }

            .wd-home .final-badge .dot:after {
                background: #7be0a3
            }

            .wd-home .final-ctas {
                display: flex;
                justify-content: center;
                gap: 12px;
                flex-wrap: wrap;
                margin-bottom: 30px
            }

            .wd-home .btn-dark-ghost {
                background: transparent;
                color: #fff;
                border: 1.5px solid rgba(255,255,255,.35)
            }

            .wd-home .btn-dark-ghost:hover {
                border-color: #fff
            }

            .wd-home .final-micro {
                display: inline-flex;
                justify-content: center;
                gap: 14px 26px;
                flex-wrap: nowrap;
                font-size: 13.5px;
                font-weight: 600;
                opacity: .92
            }

            .wd-home .final-micro span {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                white-space: nowrap
            }

            .wd-home .final-micro .msi {
                font-size: 17px;
                color: #7be0a3
            }

            @media(max-width: 900px) {
                .wd-home .final-micro {
                    flex-wrap:wrap;
                    justify-content: center;
                    max-width: 520px;
                    margin: 0 auto
                }
            }

            @media(max-width: 640px) {
                .wd-home .final h2 {
                    font-size:30px
                }

                .wd-home .final p {
                    font-size: 15.5px
                }

                .wd-home .final-micro {
                    gap: 10px 18px;
                    font-size: 12.5px
                }
            }

            @media(max-width: 980px) {
                .wd-home .feats {
                    grid-template-columns:1fr 1fr
                }

                .wd-home .trust-dark h2 {
                    font-size: 34px
                }
            }

            @media(max-width: 900px) {
                .wd-home .td2-card {
                    padding:26px 22px
                }
            }

            @media(max-width: 880px) {
                .wd-home .dark-testis {
                    grid-auto-columns:88%
                }
            }

            @media(max-width: 680px) {
                .wd-home .dark-testis-head .td2-ratings {
                    width:100%;
                    justify-content: flex-start
                }

                .wd-home .dark-testis-head .ln {
                    display: none
                }
            }

            @media(max-width: 640px) {
                .wd-home .td2-stats {
                    grid-template-columns:1fr;
                    gap: 14px
                }

                .wd-home .td2-stat {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                    text-align: left
                }

                .wd-home .td2-stat .n {
                    font-size: 26px
                }

                .wd-home .td2-stat .l {
                    margin-top: 0
                }

                .wd-home .dark-testis-head .rating {
                    padding: 8px 12px
                }
            }

            @media(max-width: 600px) {
                .wd-home .feats {
                    grid-template-columns:1fr
                }
            }

            @media(min-width: 641px)and (max-width:980px) {
                .wd-home .dark-testis {
                    grid-auto-columns:calc((100% - 20px)/2)
                }
            }

            .wd-home .global {
                position: relative;
                overflow: hidden
            }

            .wd-home .global>.container {
                position: relative;
                z-index: 2
            }

            .wd-home .global-bg {
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                z-index: 1;
                pointer-events: none;
                overflow: hidden
            }

            .wd-home .global-bg .dots {
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                background-image: radial-gradient(currentColor 1.1px,transparent 1.2px);
                background-size: 22px 22px;
                color: var(--green);
                opacity: .08;
                -webkit-mask-image: radial-gradient(120% 90% at 50% 28%,#000 0%,#000 45%,transparent 75%);
                mask-image: radial-gradient(120% 90% at 50% 28%,#000 0%,#000 45%,transparent 75%)
            }

            .wd-home .global-head {
                position: relative;
                max-width: 680px;
                margin: 0 auto 40px;
                text-align: center
            }

            .wd-home .global-head h2 {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 600;
                font-size: 46px;
                line-height: 1.07;
                letter-spacing: -.02em;
                margin: 14px 0
            }

            .wd-home .global-head h2 em {
                font-style: italic;
                color: var(--green-dark)
            }

            .wd-home .global-head .sub {
                color: var(--muted);
                font-size: 18px;
                font-weight: 600;
                line-height: 1.55;
                max-width: 560px;
                margin: 0 auto
            }

            .wd-home .global-panel {
                position: relative;
                max-width: 960px;
                margin: 0 auto;
                background: #fff;
                border: 1px solid var(--border-soft);
                border-radius: 24px;
                box-shadow: var(--shadow-card);
                overflow: hidden
            }

            .wd-home .global-statrow {
                display: grid;
                grid-template-columns: repeat(3,1fr);
                background: linear-gradient(180deg,var(--green-tint),#fff)
            }

            .wd-home .gstat {
                padding: 40px 24px;
                text-align: center;
                border-right: 1px solid var(--border-soft)
            }

            .wd-home .gstat:last-child {
                border-right: 0
            }

            .wd-home .gstat .gi {
                width: 52px;
                height: 52px;
                margin: 0 auto 14px;
                border-radius: 14px;
                background: #fff;
                color: var(--green-dark);
                display: grid;
                place-items: center;
                box-shadow: var(--shadow-soft)
            }

            .wd-home .gstat .gi .msi {
                font-size: 23px
            }

            .wd-home .gstat .gn {
                font-family: Fraunces,Fraunces Fallback,Georgia,serif;
                font-weight: 700;
                font-size: 46px;
                line-height: 1;
                letter-spacing: -.02em;
                color: var(--text)
            }

            .wd-home .gstat .gl {
                font-size: 13.5px;
                color: var(--muted);
                font-weight: 700;
                margin-top: 6px
            }

            .wd-home .global-langs {
                padding: 22px 28px 28px;
                border-top: 1px solid var(--border-soft);
                text-align: center
            }

            .wd-home .global-langs .ll-title {
                font-size: 12px;
                font-weight: 800;
                letter-spacing: .1em;
                text-transform: uppercase;
                color: var(--muted-2);
                margin-bottom: 16px
            }

            .wd-home .paystrip {
                background: var(--green-darker)
            }

            .wd-home .paystrip-inner {
                max-width: var(--maxw);
                margin: 0 auto;
                padding: 18px 28px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                flex-wrap: nowrap
            }

            .wd-home .ps-lbl {
                display: inline-flex;
                align-items: center;
                gap: 9px;
                font-weight: 800;
                font-size: 15px;
                color: #fff;
                flex: 0 0 auto;
                white-space: nowrap
            }

            .wd-home .ps-lbl .msi {
                font-size: 20px;
                color: #a7e8c6
            }

            .wd-home .stripe-badge {
                display: inline-flex;
                align-items: center;
                flex: 0 0 auto;
                border-radius: 7px;
                overflow: hidden;
                font-weight: 800;
                font-size: 14px;
                box-shadow: 0 2px 8px #14281e1f
            }

            .wd-home .stripe-badge .s1 {
                background: #0a0a0a;
                color: #fff;
                padding: 8px 12px;
                letter-spacing: -.02em
            }

            .wd-home .stripe-badge .s2 {
                background: #fff;
                color: #0a0a0a;
                padding: 8px 12px;
                white-space: nowrap
            }

            .wd-home .pay-methods {
                position: relative;
                overflow: hidden;
                flex: 1 1 auto;
                min-width: 0;
                -webkit-mask: linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);
                mask: linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)
            }

            .wd-home .pay-methods:hover .pm-track {
                animation-play-state: paused
            }

            .wd-home .pay-methods .pm {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: #fff;
                border-radius: 7px;
                padding: 6px 11px;
                height: 34px;
                margin-right: 8px;
                box-shadow: 0 1px 4px #00000038
            }

            .wd-home .pay-methods .pm img {
                height: 20px;
                width: auto;
                max-width: 84px;
                object-fit: contain;
                display: block
            }

            .wd-home .pm-track {
                display: flex;
                align-items: center;
                width: max-content;
                animation: wd-home-pm-scroll 26s linear infinite
            }

            @keyframes wd-home-pm-scroll {
                0% {
                    transform: translate(0)
                }

                to {
                    transform: translate(-50%)
                }
            }

            @media(prefers-reduced-motion:reduce) {
                .wd-home .pay-methods {
                    max-width: none;
                    overflow: visible;
                    -webkit-mask: none;
                    mask: none
                }

                .wd-home .pm-track {
                    animation: none;
                    flex-wrap: wrap;
                    width: auto
                }
            }

            @media(max-width: 640px) {
                .wd-home .paystrip-inner {
                    padding:14px 16px;
                    gap: 8px;
                    flex-wrap: wrap;
                    justify-content: center
                }

                .wd-home .ps-lbl {
                    font-size: 12px;
                    gap: 6px
                }

                .wd-home .ps-lbl .msi {
                    font-size: 16px
                }

                .wd-home .pay-methods {
                    flex: 0 0 100%;
                    min-width: 0
                }
            }

            @media(min-width: 641px)and (max-width:980px) {
                .wd-home .paystrip-inner {
                    flex-wrap:nowrap;
                    gap: 10px;
                    padding: 14px 28px
                }

                .wd-home .ps-lbl {
                    font-size: 13px
                }

                .wd-home .ps-lbl .msi {
                    font-size: 17px
                }

                .wd-home .pay-methods {
                    flex: 1 1 auto;
                    min-width: 0
                }

                .wd-home .pay-methods .pm {
                    height: 28px;
                    padding: 5px 9px;
                    margin-right: 6px
                }

                .wd-home .pay-methods .pm img {
                    height: 16px;
                    max-width: 66px
                }
            }

            .wd-home .lang-pills {
                display: flex;
                flex-wrap: wrap;
                gap: 9px;
                justify-content: center
            }

            .wd-home .lang-pill {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: var(--cream-soft);
                border: 1px solid var(--border);
                padding: 7px 14px 7px 8px;
                border-radius: 999px;
                font-weight: 800;
                font-size: 13px;
                color: var(--text);
                transition: border-color .15s,transform .15s
            }

            .wd-home .lang-pill:hover {
                border-color: var(--green);
                transform: translateY(-2px)
            }

            .wd-home .lang-pill .flag {
                width: 20px;
                height: 15px;
                border-radius: 3px;
                object-fit: cover;
                flex: 0 0 20px;
                box-shadow: 0 0 0 1px #0000000f
            }

            .wd-home .lang-pill.more {
                background: var(--green-soft);
                color: var(--green-dark);
                border-color: transparent;
                padding: 7px 16px;
                cursor: pointer;
                -webkit-user-select: none;
                user-select: none
            }

            .wd-home .lang-pill.more .msi {
                font-size: 16px;
                transition: transform .25s ease
            }

            .wd-home .lang-pill.extra {
                opacity: 0;
                transform: translateY(-6px) scale(.94);
                max-width: 0;
                padding-left: 0;
                padding-right: 0;
                border-width: 0;
                margin-right: -9px;
                pointer-events: none;
                overflow: hidden;
                white-space: nowrap;
                transition: opacity .28s ease,transform .28s ease,max-width .34s ease,padding .28s ease,margin .28s ease
            }

            @media(prefers-reduced-motion:reduce) {
                .wd-home .lang-pill.extra {
                    transition: none
                }
            }

            @media(max-width: 980px) {
                .wd-home .hero-grid {
                    grid-template-columns:1fr;
                    gap: 48px
                }

                .wd-home .hero h1 {
                    font-size: 42px
                }

                .wd-home .hero-gallery {
                    width: min(520px,100%);
                    margin: 8px auto 0
                }
            }

            @media(max-width: 880px) {
                .wd-home .ftopics {
                    grid-template-columns:1fr
                }
            }

            @media(min-width: 641px)and (max-width:980px) {
                .wd-home .ftopics {
                    grid-template-columns:1fr 1fr
                }

                .wd-home .hero-grid {
                    gap: 44px
                }
            }

            @media(max-width: 780px) {
                .wd-home .section-head h2 {
                    font-size:34px
                }
            }

            @media(max-width: 700px) {
                .wd-home .hero-eyebrow {
                    display:none
                }
            }

            @media(max-width: 680px) {
                .wd-home .global-statrow {
                    grid-template-columns:1fr
                }

                .wd-home .gstat {
                    border-right: 0;
                    border-bottom: 1px solid var(--border-soft)
                }

                .wd-home .global-head h2 {
                    font-size: 34px
                }
            }

            @media(max-width: 640px) {
                .wd-home section {
                    padding:56px 0
                }

                .wd-home .container {
                    padding: 0 20px
                }

                .wd-home .hero {
                    padding: 0 0 20px
                }

                .wd-home .hero-grid {
                    gap: 32px
                }

                .wd-home .hero h1 {
                    font-size: 33px;
                    margin: 14px 0 12px
                }

                .wd-home .hero-sub {
                    font-size: 16px;
                    line-height: 1.5
                }

                .wd-home .hero-gallery {
                    margin: 0 -20px;
                    width: auto;
                    max-width: none
                }

                .wd-home .hero-gallery .grid {
                    position: static;
                    display: flex;
                    width: 100vw;
                    max-width: 100vw;
                    height: 250px;
                    gap: 0;
                    overflow: hidden
                }

                .wd-home .hero-gallery .col-b {
                    display: none
                }

                .wd-home .hero-gallery .col-a {
                    width: 100vw;
                    max-width: 100vw;
                    overflow: hidden
                }

                .wd-home .hero-gallery .col-a .track {
                    flex-direction: row;
                    gap: 12px;
                    width: max-content;
                    animation: wd-home-hero-left 34s linear infinite
                }

                .wd-home .hero-gallery .tile,.wd-home .hero-gallery .tile.hs,.wd-home .hero-gallery .tile.hm,.wd-home .hero-gallery .tile.hl {
                    width: 196px;
                    height: 250px;
                    border-radius: 18px
                }

                .wd-home .section-head {
                    margin-bottom: 26px
                }

                .wd-home .section-head h2 {
                    font-size: 29px;
                    line-height: 1.12
                }

                .wd-home .section-head .sub {
                    font-size: 15.5px
                }

                .wd-home .ftopic-link {
                    padding: 11px 0;
                    min-height: 44px;
                    margin-top: -4px
                }

                .wd-home .lang-pill {
                    padding: 9px 14px 9px 9px
                }

                .wd-home .btn {
                    font-size: 15px;
                    padding: 14px 20px
                }
            }

            @media(min-width: 641px)and (max-width:980px) {
                .wd-home .hero {
                    padding:40px 0 24px
                }

                .wd-home .hero-grid {
                    grid-template-columns: 1fr .9fr;
                    gap: 28px;
                    align-items: center;
                    text-align: left;
                    justify-items: stretch
                }

                .wd-home .hero h1 {
                    font-size: 37px;
                    margin: 16px 0 14px;
                    letter-spacing: -.02em
                }

                .wd-home .hero-sub {
                    font-size: 16px;
                    max-width: none;
                    line-height: 1.5
                }

                .wd-home .hero-eyebrow {
                    font-size: 12px;
                    padding: 7px 12px
                }

                .wd-home .hero-ctas {
                    justify-content: flex-start;
                    margin-top: 22px
                }

                .wd-home .hero-ctas .btn {
                    font-size: 15px;
                    padding: 14px 20px
                }

                .wd-home .hero-gallery {
                    width: 100%;
                    max-width: none;
                    margin-top: -40px;
                    margin-bottom: -24px
                }

                .wd-home .hero-gallery .grid {
                    gap: 12px
                }
            }

            @media(max-width: 640px) {
                .wd-home .hero {
                    padding:0 0 20px
                }

                .wd-home .hero-grid {
                    gap: 32px
                }

                .wd-home .hero h1 {
                    margin: 14px 0 12px
                }

                .wd-home .hero-sub {
                    font-size: 16px;
                    line-height: 1.5
                }
            }

            @media(max-width: 1024px) {
                .wd-home section {
                    padding:72px 0
                }

                .wd-home .section-head {
                    margin-bottom: 38px
                }

                .wd-home .section-head h2 {
                    font-size: 36px
                }
            }

            @media(min-width: 641px)and (max-width:980px) {
                .wd-home .cards3,.wd-home .ftopics {
                    grid-template-columns:1fr 1fr
                }

                .wd-home .hero-grid {
                    gap: 44px
                }

                .wd-home .global-statrow {
                    grid-template-columns: repeat(3,1fr)
                }
            }

            @media(max-width: 640px) {
                .wd-home section {
                    padding:56px 0
                }

                .wd-home .section-head {
                    margin-bottom: 26px
                }

                .wd-home .section-head h2 {
                    font-size: 29px;
                    line-height: 1.12
                }

                .wd-home .section-head .sub {
                    font-size: 15.5px
                }
            }

            @keyframes wd-home-hero-up {
                0% {
                    transform: translateY(0)
                }

                to {
                    transform: translateY(-1120px)
                }
            }

            @keyframes wd-home-hero-down {
                0% {
                    transform: translateY(-1120px)
                }

                to {
                    transform: translateY(0)
                }
            }

            @keyframes wd-home-hero-left {
                0% {
                    transform: translate(0)
                }

                to {
                    transform: translate(-1040px)
                }
            }

            @keyframes wd-home-hs-fill {
                0% {
                    transform: scaleX(0)
                }

                to {
                    transform: scaleX(1)
                }
            }

            @keyframes wd-home-hs-up {
                0% {
                    opacity: 0;
                    transform: translateY(12px)
                }

                to {
                    opacity: 1;
                    transform: none
                }
            }

            @keyframes wd-home-hs-blink {
                0%,to {
                    opacity: 1
                }

                50% {
                    opacity: 0
                }
            }

            @media(prefers-reduced-motion:reduce) {
                .wd-home .hero-eyebrow .pulse,.wd-home .home-fundraisers .pulse,.wd-home .hero-gallery .track {
                    animation: none
                }

                .wd-home .ftopic,.wd-home .ftopic-img img,.wd-home .lang-pill,.wd-home .ftopic-link {
                    transition: none
                }

                .wd-home .hs-caret,.wd-home .hs-heart,.wd-home .hs-fill,.wd-home .hs-panel.active>* {
                    animation: none
                }

                .wd-home .hs-caret {
                    opacity: 1
                }

                .wd-home .hs-panel.active>* {
                    opacity: 1
                }
            }
        </style>
        <link id="wd-css-page-home" rel="stylesheet" href="page-home.css" media="print" onload="this.media='all'">
        <noscript>
            <link rel="stylesheet" href="page-home.css">
        </noscript>
        <style ng-app-id="ng">
            [_nghost-ng-c3926277539] {
                display: contents
            }
        </style>
        <link rel="alternate" hreflang="nl-NL" href="https://whydonate.com/nl">
        <link rel="alternate" hreflang="nl-BE" href="https://whydonate.com/nl">
        <link rel="alternate" hreflang="en-GB" href="https://whydonate.com/">
        <link rel="alternate" hreflang="en-IE" href="https://whydonate.com/">
        <link rel="alternate" hreflang="en-US" href="https://whydonate.com/">
        <link rel="alternate" hreflang="en-CA" href="https://whydonate.com/">
        <link rel="alternate" hreflang="en-AU" href="https://whydonate.com/">
        <link rel="alternate" hreflang="en-NZ" href="https://whydonate.com/">
        <link rel="alternate" hreflang="en-ZA" href="https://whydonate.com/">
        <link rel="alternate" hreflang="es-ES" href="https://whydonate.com/es">
        <link rel="alternate" hreflang="es-MX" href="https://whydonate.com/es">
        <link rel="alternate" hreflang="es-AR" href="https://whydonate.com/es">
        <link rel="alternate" hreflang="es-CO" href="https://whydonate.com/es">
        <link rel="alternate" hreflang="es-CL" href="https://whydonate.com/es">
        <link rel="alternate" hreflang="de-DE" href="https://whydonate.com/de">
        <link rel="alternate" hreflang="de-CH" href="https://whydonate.com/de">
        <link rel="alternate" hreflang="fr-FR" href="https://whydonate.com/fr">
        <link rel="alternate" hreflang="fr-BE" href="https://whydonate.com/fr">
        <link rel="alternate" hreflang="fr-CH" href="https://whydonate.com/fr">
        <link rel="alternate" hreflang="fr-CA" href="https://whydonate.com/fr">
        <link rel="alternate" hreflang="pt-PT" href="https://whydonate.com/pt">
        <link rel="alternate" hreflang="pt-BR" href="https://whydonate.com/pt">
        <link rel="alternate" hreflang="bg-BG" href="https://whydonate.com/bg">
        <link rel="alternate" hreflang="hr-HR" href="https://whydonate.com/hr">
        <link rel="alternate" hreflang="cs-CZ" href="https://whydonate.com/cs">
        <link rel="alternate" hreflang="da-DK" href="https://whydonate.com/da">
        <link rel="alternate" hreflang="fi-FI" href="https://whydonate.com/fi">
        <link rel="alternate" hreflang="el-GR" href="https://whydonate.com/el">
        <link rel="alternate" hreflang="hu-HU" href="https://whydonate.com/hu">
        <link rel="alternate" hreflang="it-IT" href="https://whydonate.com/it">
        <link rel="alternate" hreflang="pl-PL" href="https://whydonate.com/pl">
        <link rel="alternate" hreflang="ro-RO" href="https://whydonate.com/ro">
        <link rel="alternate" hreflang="sk-SK" href="https://whydonate.com/sk">
        <link rel="alternate" hreflang="sv-SE" href="https://whydonate.com/sv">
        <link rel="alternate" hreflang="uk-UA" href="https://whydonate.com/uk">
        <link rel="alternate" hreflang="bg" href="https://whydonate.com/bg">
        <link rel="alternate" hreflang="hr" href="https://whydonate.com/hr">
        <link rel="alternate" hreflang="cs" href="https://whydonate.com/cs">
        <link rel="alternate" hreflang="da" href="https://whydonate.com/da">
        <link rel="alternate" hreflang="fi" href="https://whydonate.com/fi">
        <link rel="alternate" hreflang="el" href="https://whydonate.com/el">
        <link rel="alternate" hreflang="hu" href="https://whydonate.com/hu">
        <link rel="alternate" hreflang="it" href="https://whydonate.com/it">
        <link rel="alternate" hreflang="pl" href="https://whydonate.com/pl">
        <link rel="alternate" hreflang="pt" href="https://whydonate.com/pt">
        <link rel="alternate" hreflang="ro" href="https://whydonate.com/ro">
        <link rel="alternate" hreflang="sk" href="https://whydonate.com/sk">
        <link rel="alternate" hreflang="sv" href="https://whydonate.com/sv">
        <link rel="alternate" hreflang="uk" href="https://whydonate.com/uk">
        <link rel="alternate" hreflang="nl" href="https://whydonate.com/nl">
        <link rel="alternate" hreflang="de" href="https://whydonate.com/de">
        <link rel="alternate" hreflang="es" href="https://whydonate.com/es">
        <link rel="alternate" hreflang="en" href="https://whydonate.com/">
        <link rel="alternate" hreflang="fr" href="https://whydonate.com/fr">
        <link rel="alternate" hreflang="x-default" href="https://whydonate.com/">
        <script type="application/ld+json">
            {
                "@context": "https://schema.org",
                "@graph": [
                    {
                        "@type": [
                            "Organization",
                            "OnlineBusiness"
                        ],
                        "@id": "https://whydonate.com/#organization",
                        "name": "WhyDonate",
                        "legalName": "WhyDonate B.V.",
                        "url": "https://whydonate.com/",
                        "logo": {
                            "@type": "ImageObject",
                            "@id": "https://whydonate.com/#logo",
                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/shared/WhyDonatesSVG/public",
                            "width": 600,
                            "height": 200
                        },
                        "description": "Global crowdfunding & fundraising platform. 0% platform fee.",
                        "foundingDate": "2012",
                        "address": {
                            "@type": "PostalAddress",
                            "streetAddress": "Johan Huizingalaan 763A",
                            "addressLocality": "Amsterdam",
                            "addressRegion": "Noord-Holland",
                            "postalCode": "1066 VH",
                            "addressCountry": "NL"
                        },
                        "contactPoint": [
                            {
                                "@type": "ContactPoint",
                                "telephone": "+31851074458",
                                "email": "hello@whydonate.com",
                                "contactType": "customer support",
                                "availableLanguage": [
                                    "en",
                                    "nl",
                                    "de",
                                    "es",
                                    "fr",
                                    "it"
                                ]
                            }
                        ],
                        "sameAs": [
                            "https://www.facebook.com/WhyDonate/",
                            "https://www.linkedin.com/company/whydonate",
                            "https://www.trustpilot.com/review/whydonate.com"
                        ]
                    },
                    {
                        "@type": "WebSite",
                        "@id": "https://whydonate.com/#website",
                        "url": "https://whydonate.com/",
                        "name": "WhyDonate",
                        "publisher": {
                            "@id": "https://whydonate.com/#organization"
                        },
                        "inLanguage": [
                            "en",
                            "nl",
                            "de",
                            "es",
                            "fr",
                            "it",
                            "pl",
                            "pt-PT",
                            "ro",
                            "cs",
                            "da",
                            "fi",
                            "sk",
                            "sv",
                            "uk",
                            "bg",
                            "hr",
                            "el",
                            "hu"
                        ],
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": {
                                "@type": "EntryPoint",
                                "urlTemplate": "https://whydonate.com/search?q={search_term_string}"
                            },
                            "query-input": "required name=search_term_string"
                        }
                    }
                ]
            }</script>
        <script>
            (function() {
                // Helper functions for cookie operations
                function getCookie(name) {
                    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                    return match ? decodeURIComponent(match[2]) : null;
                }
                function setCookie(name, value, days, path) {
                    var expires = '';
                    if (days) {
                        var date = new Date();
                        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                        expires = '; expires=' + date.toUTCString();
                    }
                    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=' + (path || '/');
                }
                function hasCookie(name) {
                    return getCookie(name) !== null;
                }

                // Capture UTM parameters
                var params = new URLSearchParams(window.location.search);
                var knownUTMKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_term', 'utm_content', 'utm_network', 'utm_location', 'utm_campaign_id', 'utm_adset_id', 'utm_ad_id', ];
                var knownClickIdKeys = ['fbclid', 'gclid', 'msclkid', 'ttclid', 'dclid', 'twclid', 'yclid', 'li_fat_id', 'gclsrc', 'wbraid', 'gbraid', 'zanpid', ];
                var utmData = {};
                for (var i = 0; i < knownUTMKeys.length; i++) {
                    var key = knownUTMKeys[i];
                    var value = params.get(key);
                    if (value)
                        utmData[key] = value;
                }
                for (var entry of params.entries()) {
                    var k = entry[0].toLowerCase();
                    var v = entry[1];
                    if (!v)
                        continue;
                    if (knownClickIdKeys.indexOf(k) !== -1 || k.endsWith('clid')) {
                        utmData['click_id'] = v;
                    }
                }
                if (Object.keys(utmData).length > 0) {
                    try {
                        localStorage.setItem('latest_utm', JSON.stringify(utmData));
                    } catch (e) {}
                }

                // Capture landing context (referrer, landing page URL, timestamp)
                try {
                    var hasReferrer = hasCookie('wd_referrer');
                    var hasLanding = hasCookie('wd_landing_page_url');

                    if (!(hasReferrer && hasLanding)) {
                        var referrer = document.referrer || '';
                        var landingPageUrl = window.location.hostname + window.location.pathname + window.location.search;

                        // Only save referrer if it's external (not from same domain)
                        var isExternalReferrer = referrer && referrer.indexOf(window.location.hostname) === -1;

                        if (!hasReferrer && isExternalReferrer) {
                            setCookie('wd_referrer', referrer, 365, '/');
                        } else if (!hasReferrer && !referrer) {
                            // Direct traffic - save empty string to mark as captured
                            setCookie('wd_referrer', '', 365, '/');
                        }
                        if (!hasLanding)
                            setCookie('wd_landing_page_url', landingPageUrl, 365, '/');

                        if (!hasCookie('wd_landing_ts')) {
                            setCookie('wd_landing_ts', String(Date.now()), 365, '/');
                        }
                    }
                } catch (error) {
                    console.error('Error capturing landing context:', error);
                }
            }
            )();
        </script>
        <script data-cfasync="false" nonce="3bbcbe93-985e-4865-8454-0e8766a7bd2c">
            try {
                (function(w, d) {
                    !function(lP, lQ, lR, lS) {
                        if (lP.zaraz)
                            console.error("zaraz is loaded twice");
                        else {
                            lP[lR] = lP[lR] || {};
                            lP[lR].executed = [];
                            lP.zaraz = {
                                deferred: [],
                                listeners: []
                            };
                            lP.zaraz._v = "20";
                            lP.zaraz._n = "3bbcbe93-985e-4865-8454-0e8766a7bd2c";
                            lP.zaraz.q = [];
                            lP.zaraz._f = function(lT) {
                                return async function() {
                                    var lU = Array.prototype.slice.call(arguments);
                                    lP.zaraz.q.push({
                                        m: lT,
                                        a: lU
                                    })
                                }
                            }
                            ;
                            for (const lV of ["track", "set", "ecommerce", "debug"])
                                lP.zaraz[lV] = lP.zaraz._f(lV);
                            lP.zaraz.init = () => {
                                var lW = lQ.getElementsByTagName(lS)[0]
                                  , lX = lQ.createElement(lS)
                                  , lY = lQ.getElementsByTagName("title")[0];
                                lY && (lP[lR].t = lQ.getElementsByTagName("title")[0].text);
                                lP[lR].x = Math.random();
                                lP[lR].w = lP.screen.width;
                                lP[lR].h = lP.screen.height;
                                lP[lR].j = lP.innerHeight;
                                lP[lR].e = lP.innerWidth;
                                lP[lR].l = lP.location.href;
                                lP[lR].r = lQ.referrer;
                                lP[lR].k = lP.screen.colorDepth;
                                lP[lR].n = lQ.characterSet;
                                lP[lR].o = (new Date).getTimezoneOffset();
                                if (lP.dataLayer)
                                    for (const lZ of Object.entries(Object.entries(dataLayer).reduce( (l$, ma) => ({
                                        ...l$[1],
                                        ...ma[1]
                                    }), {})))
                                        zaraz.set(lZ[0], lZ[1], {
                                            scope: "page"
                                        });
                                lP[lR].q = [];
                                for (; lP.zaraz.q.length; ) {
                                    const mb = lP.zaraz.q.shift();
                                    lP[lR].q.push(mb)
                                }
                                lX.defer = !0;
                                for (const mc of [localStorage, sessionStorage])
                                    Object.keys(mc || {}).filter(me => me.startsWith("_zaraz_")).forEach(md => {
                                        try {
                                            lP[lR]["z_" + md.slice(7)] = JSON.parse(mc.getItem(md))
                                        } catch {
                                            lP[lR]["z_" + md.slice(7)] = mc.getItem(md)
                                        }
                                    }
                                    );
                                lX.referrerPolicy = "origin";
                                lX.src = "/cdn-cgi/zaraz/s.js?z=" + btoa(encodeURIComponent(JSON.stringify(lP[lR])));
                                lW.parentNode.insertBefore(lX, lW)
                            }
                            ;
                            ["complete", "interactive"].includes(lQ.readyState) ? zaraz.init() : lP.addEventListener("DOMContentLoaded", zaraz.init)
                        }
                    }(w, d, "zarazData", "script");
                    window.zaraz._p = async nK => new Promise(nL => {
                        if (nK) {
                            nK.e && nK.e.forEach(nM => {
                                try {
                                    const nN = d.querySelector("script[nonce]")
                                      , nO = nN?.nonce || nN?.getAttribute("nonce")
                                      , nP = d.createElement("script");
                                    nO && (nP.nonce = nO);
                                    nP.innerHTML = nM;
                                    nP.onload = () => {
                                        d.head.removeChild(nP)
                                    }
                                    ;
                                    d.head.appendChild(nP)
                                } catch (nQ) {
                                    console.error(`Error executing script: ${nM}\n`, nQ)
                                }
                            }
                            );
                            Promise.allSettled((nK.f || []).map(nR => fetch(nR[0], nR[1])))
                        }
                        nL()
                    }
                    );
                    zaraz._p({
                        "e": ["(function(w,d){})(window,document)"]
                    });
                }
                )(window, document)
            } catch (e) {
                throw fetch("/cdn-cgi/zaraz/t"),
                e;
            }
            ;</script>
    </head>
    <body class>
        <!--nghm-->
        <script type="text/javascript" id="ng-event-dispatch-contract">
            ( () => {
                function p(t, n, r, o, e, i, f, m) {
                    return {
                        eventType: t,
                        event: n,
                        targetElement: r,
                        eic: o,
                        timeStamp: e,
                        eia: i,
                        eirp: f,
                        eiack: m
                    }
                }
                function u(t) {
                    let n = []
                      , r = e => {
                        n.push(e)
                    }
                    ;
                    return {
                        c: t,
                        q: n,
                        et: [],
                        etc: [],
                        d: r,
                        h: e => {
                            r(p(e.type, e, e.target, t, Date.now()))
                        }
                    }
                }
                function s(t, n, r) {
                    for (let o = 0; o < n.length; o++) {
                        let e = n[o];
                        (r ? t.etc : t.et).push(e),
                        t.c.addEventListener(e, t.h, r)
                    }
                }
                function c(t, n, r, o, e=window) {
                    let i = u(t);
                    e._ejsas || (e._ejsas = {}),
                    e._ejsas[n] = i,
                    s(i, r),
                    s(i, o, !0)
                }
                window.__jsaction_bootstrap = c;
            }
            )();
        </script>
        <script>
            window.__jsaction_bootstrap(document.body, "ng", ["click", "focusin", "focusout", "keydown"], []);
        </script>
        <app-root id="app-root" ng-version="20.3.26" _nghost-ng-c1414614956 ngh="29" ng-server-context="ssr">
            <!---->
            <div _ngcontent-ng-c1414614956 class="flex h-[100dvh] flex-col overflow-hidden">
                <app-emergency-banner _ngcontent-ng-c1414614956 _nghost-ng-c749988996 ngh="0">
                <!---->
                </app-emergency-banner>
                <!---->
                <app-header _ngcontent-ng-c1414614956 ngskiphydration id="header" name="header">
                    <header id="siteNav" class="site-nav">
                        <div class="nav-inner">
                            <div class="nav-left">
                                <!---->
                                <nav aria-label="Primary" class="nav-menubar">
                                    <div class="nav-item">
                                        <button id="headerExploreButton" type="button" aria-haspopup="true" class="nav-link" aria-expanded="false">
                                            <span>Fundraise</span>
                                            <span class="material-icons-outlined caret">expand_more</span>
                                        </button>
                                    </div>
                                    <div class="nav-item">
                                        <button id="headerDonateButton" type="button" aria-haspopup="true" class="nav-link" aria-expanded="false">
                                            <span>Donate</span>
                                            <span class="material-icons-outlined caret">expand_more</span>
                                        </button>
                                    </div>
                                    <div class="nav-item">
                                        <button type="button" aria-haspopup="true" class="nav-link" aria-expanded="false">
                                            <span>Platform</span>
                                            <span class="material-icons-outlined caret">expand_more</span>
                                        </button>
                                    </div>
                                    <div class="nav-item">
                                        <button id="headerAboutButton" type="button" aria-haspopup="true" class="nav-link" aria-expanded="false">
                                            <span>About</span>
                                            <span class="material-icons-outlined caret">expand_more</span>
                                        </button>
                                    </div>
                                </nav>
                                <!---->
                                <!---->
                            </div>
                            <a id="headerLogo" aria-label="WhyDonate logo" class="logo">
                                <img alt="WhyDonate" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/shared/whydonate_lg_logo/public">
                            </a>
                            <div class="nav-right">
                                <a id="headerSearchFundraiser" aria-label="Search" class="nav-icon-btn nav-search">
                                    <span class="material-icons-outlined text-22">search</span>
                                </a>
                                <!---->
                                <a id="loginButton" class="nav-login">Log In</a>
                                <!---->
                                <!---->
                                <!---->
                                <button id="start_fundraiser" class="btn-primary nav-cta">Start Fundraiser
  
</button>
                                <button aria-label="Open menu" class="nav-burger" aria-expanded="false">
                                    <span class="material-icons-outlined text-24">menu</span>
                                </button>
                                <!---->
                            </div>
                        </div>
                        <div class="mega" aria-hidden="true">
                        <!---->
                        <!---->
                        <!---->
                        <!---->
                        </div>
                        <!---->
                    </header>
                    <div class="m-drawer" aria-hidden="true">
                        <div class="m-scrim"></div>
                        <div role="dialog" aria-modal="true" aria-label="Menu" class="m-panel">
                            <div class="m-head">
                                <img alt="WhyDonate" class="m-logo" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/shared/whydonate_lg_logo/public">
                                <button aria-label="Close menu" class="m-close">
                                    <span class="material-icons-outlined text-24">close</span>
                                </button>
                            </div>
                            <div class="m-body">
                                <div class="m-group">
                                    <button class="m-acc" aria-expanded="false">
                                        <span>Fundraise</span>
                                        <span class="material-icons-outlined chev">expand_more</span>
                                    </button>
                                    <div class="m-sub">
                                        <div>
                                            <span class="m-sublabel">Browse by cause</span>
                                            <a href="https://whydonate.com/medical-fundraising">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="medical">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
                                                            <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/>
                                                            <circle cx="20" cy="10" r="2"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Medical Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/fundraising-for-education">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="education">
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
                                                            <path d="M22 10v6"/>
                                                            <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Education Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/emergency-fundraiser">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="emergency">
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M12 11v4"/>
                                                            <path d="M14 13h-4"/>
                                                            <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                                                            <path d="M18 6v14"/>
                                                            <path d="M6 6v14"/>
                                                            <rect width="20" height="14" x="2" y="6" rx="2"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Emergency Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/child-welfare-fundraising">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="child-welfare">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M9 12h.01"/>
                                                            <path d="M15 12h.01"/>
                                                            <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/>
                                                            <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Child Welfare Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/personal-fundraising">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="personal">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                                            <circle cx="9" cy="7" r="4"/>
                                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Personal Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/crowdfunding-charity">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="charity">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/>
                                                            <path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/>
                                                            <path d="m2 15 6 6"/>
                                                            <path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Charity Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/fundraising-for-nonprofits">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="nonprofit">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <line x1="3" x2="21" y1="22" y2="22"/>
                                                            <line x1="6" x2="6" y1="18" y2="11"/>
                                                            <line x1="10" x2="10" y1="18" y2="11"/>
                                                            <line x1="14" x2="14" y1="18" y2="11"/>
                                                            <line x1="18" x2="18" y1="18" y2="11"/>
                                                            <polygon points="12 2 20 7 4 7"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Nonprofit Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/animal-welfare-fundraising">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="animal">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 25 23" fill="none">
                                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M14.1797 12.2983C13.9727 12.2983 13.8047 12.4663 13.8047 12.6733C13.8047 12.8803 13.9727 13.0483 14.1797 13.0483C14.3866 13.0483 14.5546 12.8803 14.5546 12.6733C14.5546 12.4663 14.3866 12.2983 14.1797 12.2983Z" fill="currentColor" stroke="currentColor" stroke-width="0.6"/>
                                                            <path d="M18.2833 14.6592C17.8479 14.2138 16.7919 13.0081 15.9589 11.0529C15.3394 9.53161 13.8989 8.54883 12.288 8.54883C10.6773 8.54883 9.23709 9.53176 8.61749 11.0534C7.57235 13.507 6.14455 14.8054 6.13085 14.8177C6.12918 14.8191 6.12755 14.8207 6.12592 14.8221C5.28377 15.5939 4.80078 16.6995 4.80078 17.8554C4.80078 19.2685 5.4582 20.4973 6.59865 21.276C7.66126 22.0016 8.97827 22.2191 10.2118 21.873C10.8299 21.6996 11.5454 21.608 12.281 21.608C13.029 21.608 13.7551 21.7027 14.3807 21.8818C15.578 22.2249 16.8921 22.0368 17.977 21.3031C19.1305 20.523 19.7993 19.2825 19.7993 17.8554C19.7993 16.6003 19.2472 15.4371 18.2833 14.6592ZM17.4647 20.5097C16.6275 21.0759 15.5947 21.2422 14.631 20.9661C13.9249 20.7639 13.1123 20.6571 12.2809 20.6571C11.4635 20.6571 10.6631 20.7604 9.96604 20.9559C8.99216 21.2293 7.95269 21.0576 7.11407 20.485C6.23847 19.8871 5.72965 18.9524 5.72965 17.8554C5.72965 16.9704 6.09921 16.1238 6.74362 15.5322C6.84275 15.4433 8.35016 14.0619 9.47055 11.4296C9.47157 11.4272 9.47264 11.4247 9.47362 11.4222C9.94779 10.2543 11.0524 9.49971 12.2878 9.49971C13.5236 9.49971 14.6285 10.2541 15.1025 11.4217C15.1035 11.4242 15.1045 11.4267 15.1056 11.4291C16.0154 13.5663 17.1867 14.8856 17.6481 15.3537C17.6614 15.3671 17.6754 15.3798 17.6901 15.3915C18.4401 15.9879 18.8702 16.886 18.8702 17.8554C18.8702 18.9616 18.3532 19.9089 17.4647 20.5097Z" fill="currentColor" stroke="currentColor" stroke-width="0.6"/>
                                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M15.2951 14.0107C15.173 13.7955 14.9222 13.7345 14.7348 13.8748C14.5474 14.0151 14.4944 14.3032 14.6164 14.5185C15.2326 15.6053 15.8168 16.3292 16.1103 16.664C16.269 16.8449 16.5254 16.8439 16.683 16.6616C16.8406 16.4793 16.8396 16.1847 16.6809 16.0037C16.4103 15.6949 15.8704 15.0256 15.2951 14.0107Z" fill="currentColor" stroke="currentColor" stroke-width="0.6"/>
                                                            <path d="M11.0259 6.52474C11.4537 5.75923 11.632 4.74249 11.5152 3.7355C11.2893 1.77498 9.96864 0.13261 8.49319 0.314017C7.82694 0.394739 7.23459 0.842513 6.82498 1.57484C6.39748 2.33976 6.21914 3.3565 6.33569 4.36422C6.70479 7.56596 9.61593 9.04653 11.0259 6.52474ZM7.59772 2.02767C7.84141 1.5918 8.22155 1.21276 8.71155 1.21276C9.5877 1.21276 10.4668 2.41692 10.6311 3.84265C10.7259 4.66003 10.5882 5.47258 10.2532 6.07195C9.22725 7.90717 7.4623 6.35993 7.21985 4.2572C7.12525 3.43918 7.26304 2.62655 7.59772 2.02767Z" fill="currentColor" stroke="currentColor" stroke-width="0.6"/>
                                                            <path d="M6.25418 11.6861C6.38904 10.8788 6.22516 9.98607 5.79278 9.1722C5.36021 8.35814 4.7061 7.71149 3.95085 7.35132C3.14874 6.96877 2.3273 6.94903 1.63788 7.29566C0.948456 7.64201 0.489989 8.30479 0.346794 9.16205C0.211937 9.96936 0.375814 10.8621 0.808195 11.676C1.24081 12.4899 1.89492 13.1364 2.65017 13.4966C3.39968 13.854 4.23007 13.9208 4.963 13.5526C5.65252 13.2063 6.11108 12.5434 6.25418 11.6861ZM4.53542 12.7478C4.11478 12.9593 3.591 12.9363 3.06047 12.6833C2.48331 12.408 1.97742 11.9026 1.63592 11.2602C1.29461 10.6177 1.16334 9.9242 1.26638 9.30726C1.36109 8.74028 1.64496 8.31176 2.06565 8.10043C2.0656 8.10047 2.0657 8.10038 2.06565 8.10043C2.53082 7.86658 3.06974 7.94004 3.5406 8.1646C4.11771 8.43985 4.6236 8.94537 4.9651 9.58799C5.30641 10.2305 5.43768 10.924 5.33464 11.5409C5.23998 12.1079 4.95611 12.5365 4.53542 12.7478Z" fill="currentColor"/>
                                                            <path d="M2.06565 8.10043C1.64496 8.31176 1.36109 8.74028 1.26638 9.30726C1.16334 9.9242 1.29461 10.6177 1.63592 11.2602C1.97742 11.9026 2.48331 12.408 3.06047 12.6833C3.591 12.9363 4.11478 12.9593 4.53542 12.7478C4.95611 12.5365 5.23998 12.1079 5.33464 11.5409C5.43768 10.924 5.30641 10.2305 4.9651 9.58799C4.6236 8.94537 4.11771 8.43985 3.5406 8.1646C3.06974 7.94004 2.53082 7.86658 2.06565 8.10043ZM2.06565 8.10043C2.0657 8.10038 2.0656 8.10047 2.06565 8.10043ZM6.25418 11.6861C6.38904 10.8788 6.22516 9.98607 5.79278 9.1722C5.36021 8.35814 4.7061 7.71149 3.95085 7.35132C3.14874 6.96877 2.3273 6.94903 1.63788 7.29566C0.948456 7.64201 0.489989 8.30479 0.346794 9.16205C0.211937 9.96936 0.375814 10.8621 0.808195 11.676C1.24081 12.4899 1.89492 13.1364 2.65017 13.4966C3.39968 13.854 4.23007 13.9208 4.963 13.5526C5.65252 13.2063 6.11108 12.5434 6.25418 11.6861Z" stroke="currentColor" stroke-width="0.6"/>
                                                            <path d="M16.2151 7.79956C17.5647 7.79956 18.7967 6.29064 19.0198 4.36426C19.2568 2.31211 18.2471 0.300293 16.6433 0.300293C15.2935 0.300293 14.0616 1.80925 13.8391 3.73559C13.6017 5.79148 14.6144 7.79956 16.2151 7.79956ZM14.7233 3.84268C14.8881 2.41673 15.7674 1.21203 16.6434 1.21203C16.6846 1.21203 16.7202 1.21409 16.752 1.21833C17.2267 1.27235 17.5942 1.6972 17.8106 2.13098C18.1051 2.72095 18.2235 3.49588 18.1356 4.25699C17.9645 5.73427 17.0083 7.00133 16.1065 6.88148L16.1016 6.88084C15.6968 6.83206 15.3128 6.49971 15.0482 5.96905C14.7538 5.37904 14.6354 4.60402 14.7233 3.84268Z" fill="currentColor" stroke="currentColor" stroke-width="0.6"/>
                                                            <path d="M24.2582 9.16215C23.9636 7.39758 22.3235 6.55404 20.654 7.35082C19.0921 8.09605 18.0715 10.0158 18.3506 11.6871C18.6487 13.4725 20.3051 14.2852 21.9547 13.4981C23.5171 12.7528 24.5372 10.8333 24.2582 9.16215ZM21.5444 12.6845C21.0139 12.9376 20.4901 12.9605 20.0694 12.7491C19.6487 12.5377 19.3648 12.1089 19.2702 11.5418C19.0572 10.2661 19.8682 8.73512 21.0643 8.16429C22.1604 7.64129 23.1426 8.1337 23.3385 9.30736C23.5512 10.5807 22.7427 12.1129 21.5444 12.6845Z" fill="currentColor" stroke="currentColor" stroke-width="0.6"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Animal Welfare Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/fundraising-for-human-rights">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="human-rights">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                                                            <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                                                            <path d="M7 21h10"/>
                                                            <path d="M12 3v18"/>
                                                            <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Human Rights Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/corporate-giving">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="corporate">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                                            <rect width="20" height="14" x="2" y="6" rx="2"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Corporate Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/fundraising-for-special-needs">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="special-needs">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                            <circle cx="16" cy="4" r="1"/>
                                                            <path d="m18 19 1-7-6 1"/>
                                                            <path d="m5 8 3-3 5.5 3-2.36 3.5"/>
                                                            <path d="M4.24 14.5a5 5 0 0 0 6.88 6"/>
                                                            <path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Special Needs Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/fundraising-for-religion">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="religion">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M10 9h4"/>
                                                            <path d="M12 7v5"/>
                                                            <path d="M14 22v-4a2 2 0 0 0-4 0v4"/>
                                                            <path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22"/>
                                                            <path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.618a1 1 0 0 1 .553-.894L6 7"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Religion Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/sports-fundraising">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="sports">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                                                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                                                            <path d="M4 22h16"/>
                                                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                                                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                                                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Sports Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/fundraising-for-funeral">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="funeral">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1"/>
                                                            <circle cx="12" cy="8" r="2"/>
                                                            <path d="M12 10v12"/>
                                                            <path d="M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z"/>
                                                            <path d="M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Funeral Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/crowdfunding-music">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="music">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M9 18V5l12-2v13"/>
                                                            <circle cx="6" cy="18" r="3"/>
                                                            <circle cx="18" cy="16" r="3"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Music Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/travel-expenses">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="travel">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Travel Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/legal-services-lawyer-fees-fundraiser">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="legal">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: scaleX(-1);">
                                                            <path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381"/>
                                                            <path d="m16 16 6-6"/>
                                                            <path d="m21.5 10.5-8-8"/>
                                                            <path d="m8 8 6-6"/>
                                                            <path d="m8.5 7.5 8 8"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Legal Fundraising</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div class="m-group">
                                    <button class="m-acc" aria-expanded="false">
                                        <span>Donate</span>
                                        <span class="material-icons-outlined chev">expand_more</span>
                                    </button>
                                    <div class="m-sub">
                                        <div>
                                            <span class="m-sublabel">Find a cause</span>
                                            <a href="https://whydonate.com/fundraising-category">
                                                <span>Browse by Category</span>
                                            </a>
                                            <span class="m-sublabel">Urgent Cases</span>
                                            <a href="https://whydonate.com/donate-to-palestine">
                                                <span>Palestine</span>
                                            </a>
                                            <a href="https://whydonate.com/support-ukraine">
                                                <span>Ukraine</span>
                                            </a>
                                            <a href="https://whydonate.com/financial-help-for-flood-victims">
                                                <span>Flood</span>
                                            </a>
                                            <a href="https://whydonate.com/colombia-earthquake-relief">
                                                <span>Colombia Earthquake</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div class="m-group">
                                    <button class="m-acc" aria-expanded="false">
                                        <span>Platform</span>
                                        <span class="material-icons-outlined chev">expand_more</span>
                                    </button>
                                    <div class="m-sub">
                                        <div>
                                            <span class="m-sublabel">Features</span>
                                            <a href="https://whydonate.com/global-fundraising-europe">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="global">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                                            <circle cx="12" cy="12" r="9"/>
                                                            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Global Crowdfunding</span>
                                            </a>
                                            <a href="https://whydonate.com/custom-crowdfunding-platform">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="custom-branding">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/>
                                                            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                                                            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                                                            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                                                            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Custom Branding</span>
                                            </a>
                                            <a href="https://whydonate.com/recurring-donations-giving">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="recurring">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/>
                                                            <path d="M3 3v5h5"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Recurring Donations</span>
                                            </a>
                                            <a href="https://whydonate.com/donation-qr-code-fundraising-charity">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="qr-code">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                                            <rect x="4" y="4" width="6" height="6" rx="1"/>
                                                            <rect x="14" y="4" width="6" height="6" rx="1"/>
                                                            <rect x="4" y="14" width="6" height="6" rx="1"/>
                                                            <path d="M14 14h2v2h-2zM18 18h2v2h-2zM18 14h.01M14 18h.01"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>QR Code and Payment Requests</span>
                                            </a>
                                            <a href="https://whydonate.com/peer-to-peer-fundraising">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="peer-to-peer">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                                            <circle cx="6" cy="6" r="3"/>
                                                            <circle cx="18" cy="18" r="3"/>
                                                            <path d="M6 9v6a3 3 0 0 0 3 3h6"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Peer-to-Peer Fundraising</span>
                                            </a>
                                            <a href="https://whydonate.com/donate-button-website">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="donation-form">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                                            <rect x="4" y="4" width="16" height="16" rx="2"/>
                                                            <path d="m9 12 2 2 4-4"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Donation Form Plugin</span>
                                            </a>
                                            <a href="https://whydonate.com/zapier-integration">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="zapier">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/>
                                                            <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Zapier Integration</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div class="m-group">
                                    <button class="m-acc" aria-expanded="false">
                                        <span>About</span>
                                        <span class="material-icons-outlined chev">expand_more</span>
                                    </button>
                                    <div class="m-sub">
                                        <div>
                                            <span class="m-sublabel">Company</span>
                                            <a href="https://helpdesk.whydonate.com/en/">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="helpdesk">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                                            <circle cx="12" cy="12" r="9"/>
                                                            <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/>
                                                            <path d="M12 17h.01"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Helpdesk</span>
                                            </a>
                                            <a href="https://whydonate.com/about-whydonate">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="about">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                                            <circle cx="12" cy="12" r="9"/>
                                                            <path d="M12 16v-4M12 8h.01"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>About WhyDonate</span>
                                            </a>
                                            <a href="https://whydonate.com/fees">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="fees">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Fees</span>
                                            </a>
                                            <a href="https://whydonate.com/contact-us">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="contact">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Contact Us</span>
                                            </a>
                                            <a href="https://whydonate.com/does-whydonate-operate-in-my-country">
                                                <span class="mi">
                                                    <app-nav-drawer-icon name="countries">
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <!---->
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                                            <circle cx="12" cy="12" r="9"/>
                                                            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>
                                                        </svg>
                                                        <!---->
                                                        <!---->
                                                    </app-nav-drawer-icon>
                                                </span>
                                                <span>Countries We Support</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="m-foot">
                                <a class="btn-outline" href="https://whydonate.com/organisation">
                                    <span class="mi">
                                        <app-nav-drawer-icon name="organisation">
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <!---->
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                                <rect x="4" y="2" width="16" height="20" rx="2"/>
                                                <path d="M9 22v-4h6v4"/>
                                                <path d="M8 6h.01"/>
                                                <path d="M12 6h.01"/>
                                                <path d="M16 6h.01"/>
                                                <path d="M8 10h.01"/>
                                                <path d="M12 10h.01"/>
                                                <path d="M16 10h.01"/>
                                                <path d="M8 14h.01"/>
                                                <path d="M12 14h.01"/>
                                                <path d="M16 14h.01"/>
                                            </svg>
                                            <!---->
                                        </app-nav-drawer-icon>
                                    </span>
                                    <span>Build Fundraiser for Organization</span>
                                </a>
                                <button class="btn-primary">Start Fundraiser
  
</button>
                                <a class="m-login">Log In</a>
                                <!---->
                            </div>
                        </div>
                    </div>
                    <!---->
                </app-header>
                <app-drawer-container _ngcontent-ng-c1414614956 autosize class="flex min-h-0 flex-1 overflow-hidden flex-row relative w-full" ngh="1">
                    <app-drawer _ngcontent-ng-c1414614956 ngskiphydration class="app-sidenav-drawer max-[628px]:!w-[90%] min-[629px]:max-[1023px]:!w-[45%] absolute block h-full left-0 overflow-hidden top-0" style="z-index: 70; pointer-events: none;">
                        <aside class="block h-full w-full overflow-hidden bg-white" style="transition: transform 0.3s ease, width 0.3s ease; transform: translateX(-100%);">
                            <div _ngcontent-ng-c1414614956 id="sidenav" class="h-full overflow-y-auto overscroll-contain">
                                <!---->
                                <app-sidenav _ngcontent-ng-c1414614956 ngh="2">
                                <!---->
                                <!---->
                                </app-sidenav>
                                <!---->
                            </div>
                        </aside>
                    </app-drawer>
                    <!---->
                    <app-drawer-content _ngcontent-ng-c1414614956 class="flex h-full flex-col block flex-1 isolate min-w-0 overflow-hidden relative" ngh="3">
                        <div _ngcontent-ng-c1414614956 id="mainContent" class="block h-full w-full overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
                            <div _ngcontent-ng-c1414614956 class="flex min-h-full min-w-0 flex-col">
                                <div _ngcontent-ng-c1414614956 class="max-w-none min-h-[calc(100dvh-80px)] min-w-0 mx-auto w-full">
                                    <router-outlet _ngcontent-ng-c1414614956></router-outlet>
                                    <app-cms-page _nghost-ng-c3822806064 ngh="26" jsaction="click:;">
                                        <div _ngcontent-ng-c3822806064 class="w-full" data-cms-page="home">
                                            <!---->
                                            <app-dynamic-block _ngcontent-ng-c3822806064 _nghost-ng-c1846917774 ngh="7">
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <app-home-hero-block _ngcontent-ng-c1846917774 class="wd-home" ngh="6">
                                                    <section class="hero">
                                                        <div class="container">
                                                            <div class="hero-grid">
                                                                <div class="hero-copy">
                                                                    <span class="hero-eyebrow">
                                                                        <span class="pulse"></span>
                                                                        <span class="eb-raised">
                                                                            <b>€4,51M</b>
                                                                            <span>raised in the last 90 days</span>
                                                                        </span>
                                                                    </span>
                                                                    <!---->
                                                                    <app-ua-heading fallbacktag="h1" ngh="4">
                                                                        <h1>
                                                                            <span>
                                                                                Simple fundraising for causes that <em>matter most.</em>
                                                                            </span>
                                                                            <!---->
                                                                            <!---->
                                                                            <!---->
                                                                        </h1>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                    </app-ua-heading>
                                                                    <app-ua-heading fallbacktag="p" hclass="hero-sub" ngh="5">
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <div class="hero-sub">
                                                                            <span>
                                                                                With <strong>0% platform fees</strong>
                                                                                and a community of <strong>donors</strong>
                                                                                , launch your fundraiser in minutes and share your cause with the world. Get the support your cause deserves.
                                                                            </span>
                                                                            <!---->
                                                                            <!---->
                                                                            <!---->
                                                                        </div>
                                                                        <!---->
                                                                        <!---->
                                                                    </app-ua-heading>
                                                                    <!---->
                                                                    <div class="hero-ctas">
                                                                        <a href="/fundraising/start" appstartfundraisercta class="btn btn-primary" jsaction="click:;">Start Your Free Fundraiser</a>
                                                                    </div>
                                                                    <p class="hero-fee-note">
                                                                        <span aria-hidden="true" class="msi">info</span>
                                                                        <span>
                                                                            <strong>0% platform fee.</strong>
                                                                            Starting a fundraiser is free — standard processing fees of €0,25 + 1.9% per donation apply.
                                                                        </span>
                                                                    </p>
                                                                    <!---->
                                                                </div>
                                                                <div class="hero-gallery">
                                                                    <div class="grid">
                                                                        <div class="col col-a">
                                                                            <div class="track">
                                                                                <div class="hm tile">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=528,quality=75,format=auto" width="264" height="210" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px" fetchpriority="high">
                                                                                </div>
                                                                                <div class="hl tile">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=528,quality=75,format=auto" width="264" height="250" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hs tile">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=528,quality=75,format=auto" width="264" height="180" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hm tile">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=528,quality=75,format=auto" width="264" height="210" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hs tile">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=528,quality=75,format=auto" width="264" height="180" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hm tile" aria-hidden="true">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=528,quality=75,format=auto" width="264" height="210" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hl tile" aria-hidden="true">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=528,quality=75,format=auto" width="264" height="250" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hs tile" aria-hidden="true">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=528,quality=75,format=auto" width="264" height="180" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hm tile" aria-hidden="true">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=528,quality=75,format=auto" width="264" height="210" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hs tile" aria-hidden="true">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=528,quality=75,format=auto" width="264" height="180" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hm tile" aria-hidden="true">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=528,quality=75,format=auto" width="264" height="210" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hl tile" aria-hidden="true">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=528,quality=75,format=auto" width="264" height="250" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hs tile" aria-hidden="true">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=528,quality=75,format=auto" width="264" height="180" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hm tile" aria-hidden="true">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=528,quality=75,format=auto" width="264" height="210" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <div class="hs tile" aria-hidden="true">
                                                                                    <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=528,quality=75,format=auto" width="264" height="180" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                </div>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <div class="col col-b">
                                                                            <div class="track">
                                                                                <div class="hs tile">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=528,quality=75,format=auto" width="264" height="180" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px" fetchpriority="high">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hs tile">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=528,quality=75,format=auto" width="264" height="180" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hm tile">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=528,quality=75,format=auto" width="264" height="210" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hl tile">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=528,quality=75,format=auto" width="264" height="250" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hm tile">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=528,quality=75,format=auto" width="264" height="210" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hs tile" aria-hidden="true">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=528,quality=75,format=auto" width="264" height="180" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hs tile" aria-hidden="true">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=528,quality=75,format=auto" width="264" height="180" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hm tile" aria-hidden="true">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=528,quality=75,format=auto" width="264" height="210" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hl tile" aria-hidden="true">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=528,quality=75,format=auto" width="264" height="250" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hm tile" aria-hidden="true">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=528,quality=75,format=auto" width="264" height="210" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hs tile" aria-hidden="true">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=528,quality=75,format=auto" width="264" height="180" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hs tile" aria-hidden="true">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=528,quality=75,format=auto" width="264" height="180" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hm tile" aria-hidden="true">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=528,quality=75,format=auto" width="264" height="210" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hl tile" aria-hidden="true">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=528,quality=75,format=auto" width="264" height="250" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <div class="hm tile" aria-hidden="true">
                                                                                    <picture>
                                                                                        <source media="(max-width: 780px)" srcset="
											data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'/%3E
										">
                                                                                        <!---->
                                                                                        <img src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=528,quality=75,format=auto" width="264" height="210" alt srcset="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=196,quality=75,format=auto 196w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=264,quality=75,format=auto 264w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=392,quality=75,format=auto 392w, https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/w=528,quality=75,format=auto 528w" sizes="(max-width: 780px) 196px, 264px">
                                                                                    </picture>
                                                                                </div>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <!---->
                                                            </div>
                                                        </div>
                                                    </section>
                                                    <div class="trustbar">
                                                        <div class="trustbar-inner">
                                                            <div class="trust-item">
                                                                <span class="t-ico">
                                                                    <span aria-hidden="true" class="msi">verified_user</span>
                                                                </span>
                                                                <!---->
                                                                <span class="t-txt">
                                                                    <span class="t-title">Secure platform</span>
                                                                </span>
                                                            </div>
                                                            <div class="sep"></div>
                                                            <!---->
                                                            <div class="trust-item">
                                                                <span class="t-ico">
                                                                    <span aria-hidden="true" class="msi">trophy</span>
                                                                </span>
                                                                <!---->
                                                                <span class="t-txt">
                                                                    <span class="t-title">Europe's #1 crowdfunding platform</span>
                                                                </span>
                                                            </div>
                                                            <div class="sep"></div>
                                                            <!---->
                                                            <div class="trust-item">
                                                                <span class="t-ico">
                                                                    <span aria-hidden="true" class="msi">paid</span>
                                                                </span>
                                                                <!---->
                                                                <span class="t-txt">
                                                                    <span class="t-title">0% platform fee</span>
                                                                </span>
                                                            </div>
                                                            <div class="sep"></div>
                                                            <!---->
                                                            <div class="trust-item">
                                                                <span class="t-ico">
                                                                    <span aria-hidden="true" class="msi">headset_mic</span>
                                                                </span>
                                                                <!---->
                                                                <span class="t-txt">
                                                                    <span class="t-title">Expert support</span>
                                                                </span>
                                                            </div>
                                                            <!---->
                                                            <!---->
                                                        </div>
                                                    </div>
                                                    <!---->
                                                </app-home-hero-block>
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                            </app-dynamic-block>
                                            <app-dynamic-block _ngcontent-ng-c3822806064 _nghost-ng-c1846917774 ngh="11">
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <app-home-fundraisers-block _ngcontent-ng-c1846917774 class="wd-home" ngh="10">
                                                    <section class="home-fundraisers cream">
                                                        <div class="container">
                                                            <div class="section-head">
                                                                <span class="eyebrow">
                                                                    <span aria-hidden="true" class="pulse"></span>
                                                                    Live now
                                                                </span>
                                                                <!---->
                                                                <app-ua-heading fallbacktag="h2" ngh="8">
                                                                    <!---->
                                                                    <h2>
                                                                        <span>
                                                                            Live fundraisers<em>, raising right now.</em>
                                                                        </span>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                    </h2>
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                </app-ua-heading>
                                                            </div>
                                                            <div role="tablist" class="tabs">
                                                                <button type="button" role="tab" class="tab active" aria-selected="true" jsaction="click:;" ngb="d0">All </button>
                                                                <button type="button" role="tab" class="tab" aria-selected="false" jsaction="click:;" ngb="d0">Health &amp;Medical </button>
                                                                <button type="button" role="tab" class="tab" aria-selected="false" jsaction="click:;" ngb="d0">Crisis &amp;Emergency </button>
                                                                <button type="button" role="tab" class="tab" aria-selected="false" jsaction="click:;" ngb="d0">Animals </button>
                                                                <button type="button" role="tab" class="tab" aria-selected="false" jsaction="click:;" ngb="d0">Human Rights </button>
                                                                <button type="button" role="tab" class="tab" aria-selected="false" jsaction="click:;" ngb="d0">Community </button>
                                                                <!---->
                                                            </div>
                                                            <!---->
                                                            <div class="cards3">
                                                                <app-campaign-card _nghost-ng-c3926277539 ngh="9">
                                                                    <a _ngcontent-ng-c3926277539 href="/fundraising/vesiniidu" appstartfundraisercta class="camp" jsaction="click:;" ngb="d0">
                                                                        <div _ngcontent-ng-c3926277539 class="camp-img">
                                                                            <img _ngcontent-ng-c3926277539 loading="lazy" src="https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/1d5df8bd1e994012/public" alt="Maarit terveks/Get well Maarit!">
                                                                            <!---->
                                                                            <span _ngcontent-ng-c3926277539 class="camp-tag">Health &amp;Medical</span>
                                                                            <!---->
                                                                        </div>
                                                                        <div _ngcontent-ng-c3926277539 class="camp-body">
                                                                            <h3 _ngcontent-ng-c3926277539>Maarit terveks/Get well Maarit!</h3>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-org">by Liis Narusk
                                                                            <!---->
                                                                            </div>
                                                                            <!---->
                                                                            <div _ngcontent-ng-c3926277539 class="progress">
                                                                                <div _ngcontent-ng-c3926277539 class="fill" style="width: 0%;"></div>
                                                                            </div>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-stats">
                                                                                <div _ngcontent-ng-c3926277539 class="sm">
                                                                                    <b _ngcontent-ng-c3926277539>€71,525</b>
                                                                                    <span _ngcontent-ng-c3926277539>
                                                                                    <!--ngetn-->
                                                                                    </span>
                                                                                </div>
                                                                                <div _ngcontent-ng-c3926277539 class="sm right">
                                                                                    <b _ngcontent-ng-c3926277539>1,164 donors</b>
                                                                                    <span _ngcontent-ng-c3926277539>
                                                                                    <!--ngetn-->
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </a>
                                                                </app-campaign-card>
                                                                <app-campaign-card _nghost-ng-c3926277539 ngh="9">
                                                                    <a _ngcontent-ng-c3926277539 href="/fundraising/help-stathis-recover-from-fnd" appstartfundraisercta class="camp" jsaction="click:;" ngb="d0">
                                                                        <div _ngcontent-ng-c3926277539 class="camp-img">
                                                                            <img _ngcontent-ng-c3926277539 loading="lazy" src="https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/7abdccf569bf487c/public" alt="Help Stathis Recover from FND">
                                                                            <!---->
                                                                            <span _ngcontent-ng-c3926277539 class="camp-tag">Health &amp;Medical</span>
                                                                            <!---->
                                                                        </div>
                                                                        <div _ngcontent-ng-c3926277539 class="camp-body">
                                                                            <h3 _ngcontent-ng-c3926277539>Help Stathis Recover from FND</h3>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-org">by Efstathios Varveris
                                                                            <!---->
                                                                            </div>
                                                                            <!---->
                                                                            <div _ngcontent-ng-c3926277539 class="progress">
                                                                                <div _ngcontent-ng-c3926277539 class="fill" style="width: 21%;"></div>
                                                                            </div>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-stats">
                                                                                <div _ngcontent-ng-c3926277539 class="sm">
                                                                                    <b _ngcontent-ng-c3926277539>€51,343</b>
                                                                                    <span _ngcontent-ng-c3926277539>raised of €250,000</span>
                                                                                </div>
                                                                                <div _ngcontent-ng-c3926277539 class="sm right">
                                                                                    <b _ngcontent-ng-c3926277539>1,746 donors</b>
                                                                                    <span _ngcontent-ng-c3926277539>
                                                                                    <!--ngetn-->
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </a>
                                                                </app-campaign-card>
                                                                <app-campaign-card _nghost-ng-c3926277539 ngh="9">
                                                                    <a _ngcontent-ng-c3926277539 href="/fundraising/help-make-antoine-great-again-" appstartfundraisercta class="camp" jsaction="click:;" ngb="d0">
                                                                        <div _ngcontent-ng-c3926277539 class="camp-img">
                                                                            <img _ngcontent-ng-c3926277539 loading="lazy" src="https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/79cd2daf983b44a7/public" alt="Help make Antoine great again">
                                                                            <!---->
                                                                            <span _ngcontent-ng-c3926277539 class="camp-tag">Health &amp;Medical</span>
                                                                            <!---->
                                                                        </div>
                                                                        <div _ngcontent-ng-c3926277539 class="camp-body">
                                                                            <h3 _ngcontent-ng-c3926277539>Help make Antoine great again</h3>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-org">by Lucienne  Degiorgio 
                                                                            <!---->
                                                                            </div>
                                                                            <!---->
                                                                            <div _ngcontent-ng-c3926277539 class="progress">
                                                                                <div _ngcontent-ng-c3926277539 class="fill" style="width: 62%;"></div>
                                                                            </div>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-stats">
                                                                                <div _ngcontent-ng-c3926277539 class="sm">
                                                                                    <b _ngcontent-ng-c3926277539>€52,290</b>
                                                                                    <span _ngcontent-ng-c3926277539>raised of €85,000</span>
                                                                                </div>
                                                                                <div _ngcontent-ng-c3926277539 class="sm right">
                                                                                    <b _ngcontent-ng-c3926277539>501 donors</b>
                                                                                    <span _ngcontent-ng-c3926277539>
                                                                                    <!--ngetn-->
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </a>
                                                                </app-campaign-card>
                                                                <app-campaign-card _nghost-ng-c3926277539 ngh="9">
                                                                    <a _ngcontent-ng-c3926277539 href="/fundraising/help-extinction-rebellion-nederland" appstartfundraisercta class="camp" jsaction="click:;" ngb="d0">
                                                                        <div _ngcontent-ng-c3926277539 class="camp-img">
                                                                            <img _ngcontent-ng-c3926277539 loading="lazy" src="https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/7d2fd49168a040b6/public" alt="Help Extinction Rebellion Nederland">
                                                                            <!---->
                                                                            <span _ngcontent-ng-c3926277539 class="camp-tag">Climate &amp;Environment</span>
                                                                            <!---->
                                                                        </div>
                                                                        <div _ngcontent-ng-c3926277539 class="camp-body">
                                                                            <h3 _ngcontent-ng-c3926277539>Help Extinction Rebellion Nederland</h3>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-org">by Extinction Rebellion Nederland
                                                                            <!---->
                                                                            </div>
                                                                            <!---->
                                                                            <div _ngcontent-ng-c3926277539 class="progress">
                                                                                <div _ngcontent-ng-c3926277539 class="fill" style="width: 100%;"></div>
                                                                            </div>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-stats">
                                                                                <div _ngcontent-ng-c3926277539 class="sm">
                                                                                    <b _ngcontent-ng-c3926277539>€258,976</b>
                                                                                    <span _ngcontent-ng-c3926277539>raised of €260,000</span>
                                                                                </div>
                                                                                <div _ngcontent-ng-c3926277539 class="sm right">
                                                                                    <b _ngcontent-ng-c3926277539>10,733 donors</b>
                                                                                    <span _ngcontent-ng-c3926277539>
                                                                                    <!--ngetn-->
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </a>
                                                                </app-campaign-card>
                                                                <app-campaign-card _nghost-ng-c3926277539 ngh="9">
                                                                    <a _ngcontent-ng-c3926277539 href="/fundraising/philecias-fight-" appstartfundraisercta class="camp" jsaction="click:;" ngb="d0">
                                                                        <div _ngcontent-ng-c3926277539 class="camp-img">
                                                                            <img _ngcontent-ng-c3926277539 loading="lazy" src="https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/e7319ae54a92412b/public" alt="Philecia’s Fight">
                                                                            <!---->
                                                                            <span _ngcontent-ng-c3926277539 class="camp-tag">Health &amp;Medical</span>
                                                                            <!---->
                                                                        </div>
                                                                        <div _ngcontent-ng-c3926277539 class="camp-body">
                                                                            <h3 _ngcontent-ng-c3926277539>Philecia’s Fight</h3>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-org">by Philecia La’Bounty
                                                                            <!---->
                                                                            </div>
                                                                            <!---->
                                                                            <div _ngcontent-ng-c3926277539 class="progress">
                                                                                <div _ngcontent-ng-c3926277539 class="fill" style="width: 100%;"></div>
                                                                            </div>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-stats">
                                                                                <div _ngcontent-ng-c3926277539 class="sm">
                                                                                    <b _ngcontent-ng-c3926277539>€183,234</b>
                                                                                    <span _ngcontent-ng-c3926277539>raised of €100,000</span>
                                                                                </div>
                                                                                <div _ngcontent-ng-c3926277539 class="sm right">
                                                                                    <b _ngcontent-ng-c3926277539>4,661 donors</b>
                                                                                    <span _ngcontent-ng-c3926277539>
                                                                                    <!--ngetn-->
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </a>
                                                                </app-campaign-card>
                                                                <app-campaign-card _nghost-ng-c3926277539 ngh="9">
                                                                    <a _ngcontent-ng-c3926277539 href="/fundraising/the-only-eyes-on-the-aegean-sea-and-theyre-about-to-go-dark" appstartfundraisercta class="camp" jsaction="click:;" ngb="d0">
                                                                        <div _ngcontent-ng-c3926277539 class="camp-img">
                                                                            <img _ngcontent-ng-c3926277539 loading="lazy" src="https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/55269a0454ab41dc/public" alt="🚨The Only Eyes on the Aegean Sea - and They’re About to Go Dark">
                                                                            <!---->
                                                                            <span _ngcontent-ng-c3926277539 class="camp-tag">Humanitarian Aid</span>
                                                                            <!---->
                                                                        </div>
                                                                        <div _ngcontent-ng-c3926277539 class="camp-body">
                                                                            <h3 _ngcontent-ng-c3926277539>🚨The Only Eyes on the Aegean Sea - and They’re About to Go Dark</h3>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-org">by Aegean Boat Report
                                                                            <!---->
                                                                            </div>
                                                                            <!---->
                                                                            <div _ngcontent-ng-c3926277539 class="progress">
                                                                                <div _ngcontent-ng-c3926277539 class="fill" style="width: 26%;"></div>
                                                                            </div>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-stats">
                                                                                <div _ngcontent-ng-c3926277539 class="sm">
                                                                                    <b _ngcontent-ng-c3926277539>€26,323</b>
                                                                                    <span _ngcontent-ng-c3926277539>raised of €100,000</span>
                                                                                </div>
                                                                                <div _ngcontent-ng-c3926277539 class="sm right">
                                                                                    <b _ngcontent-ng-c3926277539>482 donors</b>
                                                                                    <span _ngcontent-ng-c3926277539>
                                                                                    <!--ngetn-->
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </a>
                                                                </app-campaign-card>
                                                                <app-campaign-card _nghost-ng-c3926277539 ngh="9">
                                                                    <a _ngcontent-ng-c3926277539 href="/fundraising/please-help-me-walk-again-" appstartfundraisercta class="camp" jsaction="click:;" ngb="d0">
                                                                        <div _ngcontent-ng-c3926277539 class="camp-img">
                                                                            <img _ngcontent-ng-c3926277539 loading="lazy" src="https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/80bfc0724fbb49b1/public" alt="Help Me Walk Again">
                                                                            <!---->
                                                                            <span _ngcontent-ng-c3926277539 class="camp-tag">Other </span>
                                                                            <!---->
                                                                        </div>
                                                                        <div _ngcontent-ng-c3926277539 class="camp-body">
                                                                            <h3 _ngcontent-ng-c3926277539>Help Me Walk Again</h3>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-org">by Nilgün Kıtay
                                                                            <!---->
                                                                            </div>
                                                                            <!---->
                                                                            <div _ngcontent-ng-c3926277539 class="progress">
                                                                                <div _ngcontent-ng-c3926277539 class="fill" style="width: 30%;"></div>
                                                                            </div>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-stats">
                                                                                <div _ngcontent-ng-c3926277539 class="sm">
                                                                                    <b _ngcontent-ng-c3926277539>€14,865</b>
                                                                                    <span _ngcontent-ng-c3926277539>raised of €50,000</span>
                                                                                </div>
                                                                                <div _ngcontent-ng-c3926277539 class="sm right">
                                                                                    <b _ngcontent-ng-c3926277539>489 donors</b>
                                                                                    <span _ngcontent-ng-c3926277539>
                                                                                    <!--ngetn-->
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </a>
                                                                </app-campaign-card>
                                                                <app-campaign-card _nghost-ng-c3926277539 ngh="9">
                                                                    <a _ngcontent-ng-c3926277539 href="/fundraising/save-abu-anas-family-in-gaza" appstartfundraisercta class="camp" jsaction="click:;" ngb="d0">
                                                                        <div _ngcontent-ng-c3926277539 class="camp-img">
                                                                            <img _ngcontent-ng-c3926277539 loading="lazy" src="https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/4f58644c8afe4415/public" alt="Save Abu Anas' family in Gaza">
                                                                            <!---->
                                                                            <span _ngcontent-ng-c3926277539 class="camp-tag">Crisis &amp;Emergency</span>
                                                                            <!---->
                                                                        </div>
                                                                        <div _ngcontent-ng-c3926277539 class="camp-body">
                                                                            <h3 _ngcontent-ng-c3926277539>Save Abu Anas' family in Gaza</h3>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-org">by Palestijnsdag
                                                                            <!---->
                                                                            </div>
                                                                            <!---->
                                                                            <div _ngcontent-ng-c3926277539 class="progress">
                                                                                <div _ngcontent-ng-c3926277539 class="fill" style="width: 0%;"></div>
                                                                            </div>
                                                                            <div _ngcontent-ng-c3926277539 class="camp-stats">
                                                                                <div _ngcontent-ng-c3926277539 class="sm">
                                                                                    <b _ngcontent-ng-c3926277539>€14,773</b>
                                                                                    <span _ngcontent-ng-c3926277539>
                                                                                    <!--ngetn-->
                                                                                    </span>
                                                                                </div>
                                                                                <div _ngcontent-ng-c3926277539 class="sm right">
                                                                                    <b _ngcontent-ng-c3926277539>308 donors</b>
                                                                                    <span _ngcontent-ng-c3926277539>
                                                                                    <!--ngetn-->
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </a>
                                                                </app-campaign-card>
                                                                <!---->
                                                            </div>
                                                            <!---->
                                                            <!---->
                                                            <div class="center-btn">
                                                                <a href="/search" appstartfundraisercta class="btn btn-outline" jsaction="click:;" ngb="d0">View all campaigns</a>
                                                            </div>
                                                            <!---->
                                                        </div>
                                                    </section>
                                                </app-home-fundraisers-block>
                                                <!--ngh=d0-->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                            </app-dynamic-block>
                                            <app-dynamic-block _ngcontent-ng-c3822806064 _nghost-ng-c1846917774 ngh="13">
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <app-home-how-block _ngcontent-ng-c1846917774 class="wd-home" ngh="12">
                                                    <section class="how">
                                                        <div class="container">
                                                            <div class="section-head">
                                                                <span class="eyebrow">How it works</span>
                                                                <!---->
                                                                <app-ua-heading fallbacktag="h2" ngh="8">
                                                                    <!---->
                                                                    <h2>
                                                                        <span>
                                                                            Start an online fundraiser and raise money in <em>under 5 minutes.</em>
                                                                        </span>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                    </h2>
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                </app-ua-heading>
                                                                <app-ua-heading fallbacktag="p" hclass="sub" ngh="5">
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <div class="sub">
                                                                        <span>No paperwork. No platform cut. Just your story, your supporters, and the funds you need.</span>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                    </div>
                                                                    <!---->
                                                                    <!---->
                                                                </app-ua-heading>
                                                                <!---->
                                                            </div>
                                                            <div class="how-stepper" jsaction="focusin:;focusout:;" ngb="d1">
                                                                <div role="tablist" class="hs-list">
                                                                    <button type="button" role="tab" class="hs-step active" id="wd-how-tab-0" aria-selected="true" aria-controls="wd-how-panel-0" jsaction="click:;" ngb="d1">
                                                                        <span class="hs-ico">
                                                                            <span aria-hidden="true" class="msi">rocket_launch</span>
                                                                        </span>
                                                                        <span class="hs-txt">
                                                                            <h3>Start a fundraiser</h3>
                                                                            <p>Sign up on WhyDonate and create your fundraiser in minutes — as an individual or an organisation.</p>
                                                                        </span>
                                                                        <span aria-hidden="true" class="hs-prog">
                                                                            <span class="hs-fill" style="animation-duration: 5200ms;"></span>
                                                                        </span>
                                                                    </button>
                                                                    <button type="button" role="tab" class="hs-step" id="wd-how-tab-1" aria-selected="false" aria-controls="wd-how-panel-1" jsaction="click:;" ngb="d1">
                                                                        <span class="hs-ico">
                                                                            <span aria-hidden="true" class="msi">share</span>
                                                                        </span>
                                                                        <span class="hs-txt">
                                                                            <h3>Share your fundraiser</h3>
                                                                            <p>Share with friends and your network through Facebook, TikTok, Instagram, WhatsApp and more.</p>
                                                                        </span>
                                                                        <span aria-hidden="true" class="hs-prog">
                                                                            <span class="hs-fill" style="animation-duration: 5200ms;"></span>
                                                                        </span>
                                                                    </button>
                                                                    <button type="button" role="tab" class="hs-step" id="wd-how-tab-2" aria-selected="false" aria-controls="wd-how-panel-2" jsaction="click:;" ngb="d1">
                                                                        <span class="hs-ico">
                                                                            <span aria-hidden="true" class="msi">trending_up</span>
                                                                        </span>
                                                                        <span class="hs-txt">
                                                                            <h3>Raise funds</h3>
                                                                            <p>Watch donations roll in as your story spreads — every contribution counts toward your goal.</p>
                                                                        </span>
                                                                        <span aria-hidden="true" class="hs-prog">
                                                                            <span class="hs-fill" style="animation-duration: 5200ms;"></span>
                                                                        </span>
                                                                    </button>
                                                                    <button type="button" role="tab" class="hs-step" id="wd-how-tab-3" aria-selected="false" aria-controls="wd-how-panel-3" jsaction="click:;" ngb="d1">
                                                                        <span class="hs-ico">
                                                                            <span aria-hidden="true" class="msi">account_balance_wallet</span>
                                                                        </span>
                                                                        <span class="hs-txt">
                                                                            <h3>Receive donations</h3>
                                                                            <p>Funds settle directly into your account — choose weekly, monthly, or instant payouts.</p>
                                                                        </span>
                                                                        <span aria-hidden="true" class="hs-prog">
                                                                            <span class="hs-fill" style="animation-duration: 5200ms;"></span>
                                                                        </span>
                                                                    </button>
                                                                    <button type="button" role="tab" class="hs-step" id="wd-how-tab-4" aria-selected="false" aria-controls="wd-how-panel-4" jsaction="click:;" ngb="d1">
                                                                        <span class="hs-ico">
                                                                            <span aria-hidden="true" class="msi">favorite</span>
                                                                        </span>
                                                                        <span class="hs-txt">
                                                                            <h3>Thank your donors</h3>
                                                                            <p>Send personalised automated thank-you emails to every donor straight from your dashboard.</p>
                                                                        </span>
                                                                        <span aria-hidden="true" class="hs-prog">
                                                                            <span class="hs-fill" style="animation-duration: 5200ms;"></span>
                                                                        </span>
                                                                    </button>
                                                                    <!---->
                                                                </div>
                                                                <div aria-hidden="true" class="hs-stage">
                                                                    <div class="hs-card">
                                                                        <div class="hs-status">
                                                                            <span>9:41</span>
                                                                            <span class="st-r">
                                                                                <span class="msi">signal_cellular_alt</span>
                                                                                <span class="msi">wifi</span>
                                                                                <span class="msi">battery_full</span>
                                                                            </span>
                                                                        </div>
                                                                        <div class="hs-panel active" id="wd-how-panel-0">
                                                                            <div class="hs-phead">
                                                                                <span class="msi">edit_square</span>
                                                                                Create your fundraiser 
                                                                            </div>
                                                                            <div class="hs-cover">
                                                                                <img alt loading="lazy" src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&amp;fit=crop&amp;w=600&amp;q=85">
                                                                                <!---->
                                                                                <span class="hs-cover-up">
                                                                                    <span class="msi">check_circle</span>
                                                                                    Cover uploaded 
                                                                                </span>
                                                                                <!---->
                                                                            </div>
                                                                            <div class="hs-cat">
                                                                                <span class="hs-cat-chip on">
                                                                                    <span class="msi">favorite</span>
                                                                                    <!---->
                                                                                    Medical 
                                                                                </span>
                                                                                <span class="hs-cat-chip">
                                                                                <!---->
                                                                                Community </span>
                                                                                <span class="hs-cat-chip">
                                                                                <!---->
                                                                                Animals </span>
                                                                                <!---->
                                                                            </div>
                                                                            <div class="hs-input2">
                                                                                <span class="hs-lbl">Fundraiser title</span>
                                                                                <span class="hs-typed">
                                                                                    A new life for Mum<i class="hs-caret"></i>
                                                                                </span>
                                                                            </div>
                                                                            <div class="hs-btn">Publish fundraiser</div>
                                                                        </div>
                                                                        <div class="hs-panel" id="wd-how-panel-1">
                                                                            <div class="hs-phead">
                                                                                <span class="msi">share</span>
                                                                                Share your link 
                                                                            </div>
                                                                            <div class="hs-linkrow">
                                                                                <span class="hs-link">whydonate.com/f/new-life-mum</span>
                                                                                <span class="hs-copy">Copy</span>
                                                                            </div>
                                                                            <div class="hs-copied">
                                                                                <span class="msi">check_circle</span>
                                                                                Link copied to clipboard 
                                                                            </div>
                                                                            <div class="hs-chips">
                                                                                <span class="hs-chip">
                                                                                    <svg viewBox="0 0 24 24" fill="#25D366" width="16" height="16">
                                                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                                                                    </svg>
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    WhatsApp 
                                                                                </span>
                                                                                <span class="hs-chip">
                                                                                    <!---->
                                                                                    <svg viewBox="0 0 24 24" fill="#E1306C" width="16" height="16">
                                                                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                                                                                    </svg>
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    Instagram 
                                                                                </span>
                                                                                <span class="hs-chip">
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <svg viewBox="0 0 24 24" fill="#1877F2" width="16" height="16">
                                                                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                                                                    </svg>
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    Facebook 
                                                                                </span>
                                                                                <span class="hs-chip">
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <svg viewBox="0 0 24 24" fill="#010101" width="16" height="16">
                                                                                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                                                                    </svg>
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    TikTok 
                                                                                </span>
                                                                                <span class="hs-chip">
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <svg viewBox="0 0 24 24" fill="#8ED500" width="16" height="16">
                                                                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 17.5h-3.2v-4.9c0-1.2-.6-1.9-1.6-1.9s-1.7.7-1.7 1.9v4.9H7.8V8.6h3.1v1.2c.5-.8 1.5-1.4 2.8-1.4 2.2 0 3.8 1.4 3.8 4.2v4.9z"/>
                                                                                    </svg>
                                                                                    <!---->
                                                                                    <!---->
                                                                                    Nextdoor 
                                                                                </span>
                                                                                <span class="hs-chip">
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <!---->
                                                                                    <span class="msi">mail</span>
                                                                                    <!---->
                                                                                    Email 
                                                                                </span>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <div class="hs-panel" id="wd-how-panel-2">
                                                                            <div class="hs-phead">
                                                                                <span class="msi">trending_up</span>
                                                                                Donations rolling in 
                                                                            </div>
                                                                            <div class="hs-raise">
                                                                                <b class="hs-amt">€13,600</b>
                                                                                <span>raised of €20,000</span>
                                                                            </div>
                                                                            <div class="hs-track">
                                                                                <span class="hs-trackfill" style="--w: 68%;"></span>
                                                                            </div>
                                                                            <div class="hs-meta">
                                                                                <span>284 donors</span>
                                                                                <span>18 days left</span>
                                                                            </div>
                                                                            <div class="hs-donors">
                                                                                <div class="hs-donor">
                                                                                    <!---->
                                                                                    <span>
                                                                                        <b>Tomas R.</b>
                                                                                        just donated
                                                                                    </span>
                                                                                    <b class="hs-amt2">€50</b>
                                                                                </div>
                                                                                <div class="hs-donor">
                                                                                    <!---->
                                                                                    <span>
                                                                                        <b>Suchi K.</b>
                                                                                        just donated
                                                                                    </span>
                                                                                    <b class="hs-amt2">€25</b>
                                                                                </div>
                                                                                <div class="hs-donor">
                                                                                    <!---->
                                                                                    <span>
                                                                                        <b>Anna V.</b>
                                                                                        just donated
                                                                                    </span>
                                                                                    <b class="hs-amt2">€100</b>
                                                                                </div>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <div class="hs-panel" id="wd-how-panel-3">
                                                                            <div class="hs-phead">
                                                                                <span class="msi">account_balance</span>
                                                                                Payout to your account 
                                                                            </div>
                                                                            <div class="hs-payout">
                                                                                <div class="hs-check">
                                                                                    <span class="msi">check</span>
                                                                                </div>
                                                                                <b>€13,600 transferred</b>
                                                                                <span>to •••• 4291 · today</span>
                                                                            </div>
                                                                            <div class="hs-opt">
                                                                                <span class="msi">bolt</span>
                                                                                <div>
                                                                                    <b>Instant payout</b>
                                                                                    <span>Funds in your account in minutes</span>
                                                                                </div>
                                                                                <span class="hs-toggle on"></span>
                                                                            </div>
                                                                            <div class="hs-opt">
                                                                                <span class="msi">calendar_month</span>
                                                                                <div>
                                                                                    <b>Weekly payout</b>
                                                                                    <span>Every Monday, automatically</span>
                                                                                </div>
                                                                                <span class="hs-toggle"></span>
                                                                            </div>
                                                                            <!---->
                                                                            <div class="hs-feenote">
                                                                                <span class="msi">verified</span>
                                                                                0% platform fee — you keep every cent 
                                                                            </div>
                                                                        </div>
                                                                        <div class="hs-panel" id="wd-how-panel-4">
                                                                            <div class="hs-phead">
                                                                                <span class="msi">favorite</span>
                                                                                Thank your donors 
                                                                            </div>
                                                                            <div class="hs-mail">
                                                                                <div class="hs-mailhead">
                                                                                    <span class="hs-mailto">To: 284 donors</span>
                                                                                    <span class="hs-sent">
                                                                                        <span class="msi">check</span>
                                                                                        Sent 
                                                                                    </span>
                                                                                </div>
                                                                                <div class="hs-subject">Thank you for giving Mum a second chance</div>
                                                                                <div class="hs-mailbody">Dear supporter — because of you, we reached our goal. Mum’s transplant is scheduled and we cannot thank you enough for standing with our family…</div>
                                                                            </div>
                                                                            <div class="hs-btn">Write thank you messages</div>
                                                                            <div class="hs-hearts">
                                                                                <span class="hs-heart" style="--d: 0s; left: 16%;">
                                                                                    <span class="msi">favorite</span>
                                                                                </span>
                                                                                <span class="hs-heart" style="--d: 0.7s; left: 48%;">
                                                                                    <span class="msi">favorite</span>
                                                                                </span>
                                                                                <span class="hs-heart" style="--d: 1.3s; left: 78%;">
                                                                                    <span class="msi">favorite</span>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </section>
                                                </app-home-how-block>
                                                <!--ngh=d1-->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                            </app-dynamic-block>
                                            <app-dynamic-block _ngcontent-ng-c3822806064 _nghost-ng-c1846917774 ngh="15">
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <app-home-payments-block _ngcontent-ng-c1846917774 class="wd-home" ngh="14">
                                                    <div class="paystrip">
                                                        <div class="paystrip-inner">
                                                            <span class="ps-lbl">
                                                                <span aria-hidden="true" class="msi">verified_user</span>
                                                                <!---->
                                                                Trusted payment method 
                                                            </span>
                                                            <!---->
                                                            <span class="stripe-badge">
                                                                <span class="s1">stripe</span>
                                                                <span class="s2">Verified Partner</span>
                                                            </span>
                                                            <!---->
                                                            <span class="pay-methods" aria-label="Accepted payment methods">
                                                                <span class="pm-track">
                                                                    <span class="pm">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/44a56fe9-d140-48e5-ac6e-2723794be700/h=60,format=auto" alt="iDEAL">
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2a12c07e-d3e0-4c1c-2fb8-23d560a14900/h=60,format=auto" alt="Swish">
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/0b5b8b48-8dbe-4da7-b540-f09939649400/h=60,format=auto" alt="BLIK">
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/bb9584e9-abd9-4bd8-e92f-373ad8d66f00/h=60,format=auto" alt="Przelewy24">
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/c90d227c-235e-4b22-2d1c-b87b09882300/h=60,format=auto" alt="Carte Bancaire">
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/09f42aa5-88a3-4d8b-2833-a842d96d0400/h=60,format=auto" alt="EPS">
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/60e3c7d3-2f52-4a7e-ecf8-3816ee79b100/h=60,format=auto" alt="MB WAY">
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/6cdf5ac2-ed95-4bde-4ac9-b60da39dca00/h=60,format=auto" alt="Satispay">
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/7d5d3ced-b642-4674-cf82-92144d7d6100/h=60,format=auto" alt="TWINT">
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm clone" aria-hidden="true">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/44a56fe9-d140-48e5-ac6e-2723794be700/h=60,format=auto" alt>
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm clone" aria-hidden="true">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2a12c07e-d3e0-4c1c-2fb8-23d560a14900/h=60,format=auto" alt>
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm clone" aria-hidden="true">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/0b5b8b48-8dbe-4da7-b540-f09939649400/h=60,format=auto" alt>
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm clone" aria-hidden="true">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/bb9584e9-abd9-4bd8-e92f-373ad8d66f00/h=60,format=auto" alt>
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm clone" aria-hidden="true">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/c90d227c-235e-4b22-2d1c-b87b09882300/h=60,format=auto" alt>
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm clone" aria-hidden="true">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/09f42aa5-88a3-4d8b-2833-a842d96d0400/h=60,format=auto" alt>
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm clone" aria-hidden="true">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/60e3c7d3-2f52-4a7e-ecf8-3816ee79b100/h=60,format=auto" alt>
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm clone" aria-hidden="true">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/6cdf5ac2-ed95-4bde-4ac9-b60da39dca00/h=60,format=auto" alt>
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <span class="pm clone" aria-hidden="true">
                                                                        <img loading="lazy" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/7d5d3ced-b642-4674-cf82-92144d7d6100/h=60,format=auto" alt>
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <!---->
                                                                </span>
                                                            </span>
                                                            <!---->
                                                        </div>
                                                    </div>
                                                </app-home-payments-block>
                                                <!--ngh=d2-->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                            </app-dynamic-block>
                                            <app-dynamic-block _ngcontent-ng-c3822806064 _nghost-ng-c1846917774 ngh="17">
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <app-home-topics-block _ngcontent-ng-c1846917774 class="wd-home" ngh="16">
                                                    <section class="home-topics">
                                                        <div class="container">
                                                            <div class="section-head">
                                                                <span class="eyebrow">Featured topics</span>
                                                                <!---->
                                                                <app-ua-heading fallbacktag="h2" ngh="8">
                                                                    <!---->
                                                                    <h2>
                                                                        <span>
                                                                            Raise money for the causes that <em>matter most.</em>
                                                                        </span>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                    </h2>
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                </app-ua-heading>
                                                                <app-ua-heading fallbacktag="p" hclass="sub" ngh="5">
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <div class="sub">
                                                                        <span>The needs we see most often on WhyDonate — explore where your support goes furthest right now.</span>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                    </div>
                                                                    <!---->
                                                                    <!---->
                                                                </app-ua-heading>
                                                                <!---->
                                                            </div>
                                                            <div class="ftopics">
                                                                <article class="ftopic">
                                                                    <div class="ftopic-img">
                                                                        <span class="ftopic-badge">
                                                                            <span class="d"></span>
                                                                            8,420 
                                                                            <!--ngtns-->
                                                                            live 
                                                                            <!---->
                                                                        </span>
                                                                        <!---->
                                                                        <img width="400" height="200" loading="lazy" src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&amp;fit=crop&amp;w=600&amp;q=85" alt srcset="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&amp;fit=crop&amp;w=300&amp;q=85 300w, https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&amp;fit=crop&amp;w=400&amp;q=85 400w, https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&amp;fit=crop&amp;w=600&amp;q=85 600w" sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 980px) calc(50vw - 40px), 397px">
                                                                        <!---->
                                                                    </div>
                                                                    <div class="ftopic-body">
                                                                        <h3>Medical &amp;health</h3>
                                                                        <p>Treatments, surgeries and recovery funds for people who simply can't wait for help to arrive.</p>
                                                                        <!---->
                                                                        <a href="/search?category=10" appstartfundraisercta class="ftopic-link" jsaction="click:;" ngb="d3">Explore medical causes</a>
                                                                        <!---->
                                                                    </div>
                                                                </article>
                                                                <article class="ftopic">
                                                                    <div class="ftopic-img">
                                                                        <span class="ftopic-badge">
                                                                            <span class="d"></span>
                                                                            3,210 
                                                                            <!--ngtns-->
                                                                            live 
                                                                            <!---->
                                                                        </span>
                                                                        <!---->
                                                                        <img width="400" height="200" loading="lazy" src="https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&amp;fit=crop&amp;w=600&amp;q=85" alt srcset="https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&amp;fit=crop&amp;w=300&amp;q=85 300w, https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&amp;fit=crop&amp;w=400&amp;q=85 400w, https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&amp;fit=crop&amp;w=600&amp;q=85 600w" sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 980px) calc(50vw - 40px), 397px">
                                                                        <!---->
                                                                    </div>
                                                                    <div class="ftopic-body">
                                                                        <h3>Memorials &amp;funerals</h3>
                                                                        <p>Honour someone you've lost and ease the unexpected costs for the family they leave behind.</p>
                                                                        <!---->
                                                                        <a href="/search?category=9" appstartfundraisercta class="ftopic-link" jsaction="click:;" ngb="d3">Explore memorials</a>
                                                                        <!---->
                                                                    </div>
                                                                </article>
                                                                <article class="ftopic">
                                                                    <div class="ftopic-img">
                                                                        <span class="ftopic-badge">
                                                                            <span class="d"></span>
                                                                            2,140 
                                                                            <!--ngtns-->
                                                                            live 
                                                                            <!---->
                                                                        </span>
                                                                        <!---->
                                                                        <img width="400" height="200" loading="lazy" src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&amp;fit=crop&amp;w=600&amp;q=85" alt srcset="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&amp;fit=crop&amp;w=300&amp;q=85 300w, https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&amp;fit=crop&amp;w=400&amp;q=85 400w, https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&amp;fit=crop&amp;w=600&amp;q=85 600w" sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 980px) calc(50vw - 40px), 397px">
                                                                        <!---->
                                                                    </div>
                                                                    <div class="ftopic-body">
                                                                        <h3>Emergency &amp;relief</h3>
                                                                        <p>Rapid support when disaster strikes — floods, fires and crises that cannot wait.</p>
                                                                        <!---->
                                                                        <a href="/search?category=4" appstartfundraisercta class="ftopic-link" jsaction="click:;" ngb="d3">Explore emergency causes</a>
                                                                        <!---->
                                                                    </div>
                                                                </article>
                                                                <!---->
                                                            </div>
                                                        </div>
                                                    </section>
                                                </app-home-topics-block>
                                                <!--ngh=d3-->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                            </app-dynamic-block>
                                            <app-dynamic-block _ngcontent-ng-c3822806064 _nghost-ng-c1846917774 ngh="19">
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <app-home-features-block _ngcontent-ng-c1846917774 class="wd-home" ngh="18">
                                                    <section class="cream-warm">
                                                        <div class="container">
                                                            <div class="section-head">
                                                                <span class="eyebrow">Platform features</span>
                                                                <!---->
                                                                <app-ua-heading fallbacktag="h2" ngh="8">
                                                                    <!---->
                                                                    <h2>
                                                                        <span>
                                                                            Everything you need for <em>successful online fundraising.</em>
                                                                        </span>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                    </h2>
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                </app-ua-heading>
                                                                <app-ua-heading fallbacktag="p" hclass="sub" ngh="5">
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <div class="sub">
                                                                        <span>From launch to donations, everything is built to help you succeed.</span>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                    </div>
                                                                    <!---->
                                                                    <!---->
                                                                </app-ua-heading>
                                                                <!---->
                                                            </div>
                                                            <div class="feats">
                                                                <div class="feat">
                                                                    <span class="fi f1">
                                                                        <span aria-hidden="true" class="msi">movie</span>
                                                                    </span>
                                                                    <h3>Promote with video &amp;social</h3>
                                                                    <p>Add a video to your story and share to WhatsApp, Instagram, Facebook and more in one tap — the campaigns that show, raise more. 
                                                                    <!---->
                                                                    </p>
                                                                    <!---->
                                                                </div>
                                                                <div class="feat">
                                                                    <span class="fi f2">
                                                                        <span aria-hidden="true" class="msi">autorenew</span>
                                                                    </span>
                                                                    <h3>Recurring donations</h3>
                                                                    <p>
                                                                        Monthly giving with auto-retry, dunning, and donor self-service. Set it and grow. <a href="https://whydonate.com/recurring-donations-giving" appstartfundraisercta class="feat-link" jsaction="click:;" ngb="d4">See how recurring giving works</a>
                                                                        <!---->
                                                                    </p>
                                                                    <!---->
                                                                </div>
                                                                <div class="feat">
                                                                    <span class="fi f3">
                                                                        <span aria-hidden="true" class="msi">palette</span>
                                                                    </span>
                                                                    <h3>Custom branding</h3>
                                                                    <p>
                                                                        Your colours, your logo, your domain. Make your fundraiser look like an extension of you. <a href="https://whydonate.com/custom-crowdfunding-platform" appstartfundraisercta class="feat-link" jsaction="click:;" ngb="d4">Explore custom branding</a>
                                                                        <!---->
                                                                    </p>
                                                                    <!---->
                                                                </div>
                                                                <div class="feat">
                                                                    <span class="fi f4">
                                                                        <span aria-hidden="true" class="msi">monitoring</span>
                                                                    </span>
                                                                    <h3>Analytics dashboard</h3>
                                                                    <p>See where every donation comes from — with native Google Analytics support to track and optimise the channels that convert. 
                                                                    <!---->
                                                                    </p>
                                                                    <!---->
                                                                </div>
                                                                <div class="feat">
                                                                    <span class="fi f5">
                                                                        <span aria-hidden="true" class="msi">mail</span>
                                                                    </span>
                                                                    <h3>Automated thank-you emails</h3>
                                                                    <p>Personalised emails fire automatically the moment a donation lands. Donors feel seen. 
                                                                    <!---->
                                                                    </p>
                                                                    <!---->
                                                                </div>
                                                                <div class="feat">
                                                                    <span class="fi f6">
                                                                        <span aria-hidden="true" class="msi">support_agent</span>
                                                                    </span>
                                                                    <h3>Human support, 7 days a week</h3>
                                                                    <p>
                                                                        Real people — not bots — on chat and email every day of the year, ready to help your campaign succeed. <a href="https://whydonate.com/contact-us" appstartfundraisercta class="feat-link" jsaction="click:;" ngb="d4">Get in touch</a>
                                                                        <!---->
                                                                    </p>
                                                                    <!---->
                                                                </div>
                                                                <!---->
                                                            </div>
                                                        </div>
                                                    </section>
                                                </app-home-features-block>
                                                <!--ngh=d4-->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                            </app-dynamic-block>
                                            <app-dynamic-block _ngcontent-ng-c3822806064 _nghost-ng-c1846917774 ngh="21">
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <app-home-trust-block _ngcontent-ng-c1846917774 class="wd-home" ngh="20">
                                                    <section class="trust-dark">
                                                        <div class="container">
                                                            <div class="td2-top">
                                                                <div class="td2-head">
                                                                    <span class="eyebrow">Trust &amp;safety</span>
                                                                    <!---->
                                                                    <app-ua-heading fallbacktag="h2" ngh="8">
                                                                        <!---->
                                                                        <h2>
                                                                            <span>
                                                                                <em>Trusted crowdfunding platform</em>
                                                                                since 2012.
                                                                            </span>
                                                                            <!---->
                                                                            <!---->
                                                                            <!---->
                                                                        </h2>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                    </app-ua-heading>
                                                                    <app-ua-heading fallbacktag="p" hclass="sub" ngh="5">
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <div class="sub">
                                                                            <span>Over a decade of secure fundraising — and independently rated by the people who've used us.</span>
                                                                            <!---->
                                                                            <!---->
                                                                            <!---->
                                                                        </div>
                                                                        <!---->
                                                                        <!---->
                                                                    </app-ua-heading>
                                                                    <!---->
                                                                    <div class="td2-pills">
                                                                        <span class="td2-pill">
                                                                            <span aria-hidden="true" class="msi">lock</span>
                                                                            <!---->
                                                                            Secure payments via Stripe 
                                                                        </span>
                                                                        <span class="td2-pill">
                                                                            <span aria-hidden="true" class="msi">verified_user</span>
                                                                            <!---->
                                                                            Verified fundraisers 
                                                                        </span>
                                                                        <span class="td2-pill">
                                                                            <span aria-hidden="true" class="msi">encrypted</span>
                                                                            <!---->
                                                                            GDPR compliant 
                                                                        </span>
                                                                        <!---->
                                                                    </div>
                                                                    <!---->
                                                                </div>
                                                                <aside class="td2-card">
                                                                    <div class="td2-stats">
                                                                        <div class="td2-stat">
                                                                            <div class="n">1,69M</div>
                                                                            <div class="l">Donors worldwide</div>
                                                                        </div>
                                                                        <div class="td2-stat">
                                                                            <div class="n">128,471</div>
                                                                            <div class="l">Fundraisers supported</div>
                                                                        </div>
                                                                        <div class="td2-stat">
                                                                            <div class="n">14+ yrs</div>
                                                                            <div class="l">Since 2012</div>
                                                                        </div>
                                                                        <!---->
                                                                    </div>
                                                                </aside>
                                                                <!---->
                                                            </div>
                                                            <div class="dark-testis-head">
                                                                <span class="lbl">What our customers say</span>
                                                                <!---->
                                                                <span class="ln"></span>
                                                                <!---->
                                                                <div class="td2-ratings">
                                                                    <a target="_blank" rel="noopener noreferrer" class="rating" href="https://www.trustpilot.com/review/whydonate.com">
                                                                        <span class="src">
                                                                            Trustpilot<span aria-hidden="true" class="msi">open_in_new</span>
                                                                        </span>
                                                                        <span class="v">
                                                                            <span aria-hidden="true" class="stars">★★★★★</span>
                                                                            4.8 
                                                                        </span>
                                                                    </a>
                                                                    <a target="_blank" rel="noopener noreferrer" class="rating" href="https://www.google.com/search?q=whydonate+reviews">
                                                                        <span class="src">
                                                                            Google<span aria-hidden="true" class="msi">open_in_new</span>
                                                                        </span>
                                                                        <span class="v">
                                                                            <span aria-hidden="true" class="stars">★★★★★</span>
                                                                            4.7 
                                                                        </span>
                                                                    </a>
                                                                    <!---->
                                                                </div>
                                                                <!---->
                                                            </div>
                                                            <!---->
                                                            <div class="dark-testis">
                                                                <article class="dark-testi">
                                                                    <div class="dt-top">
                                                                        <div aria-hidden="true" class="stars">★★★★★</div>
                                                                        <!---->
                                                                    </div>
                                                                    <h3 class="dt-title">I’m so happy with WhyDonate</h3>
                                                                    <!---->
                                                                    <blockquote>I’m so happy with WhyDonate! I live in a country where international fundraising is extremely difficult, so having a platform like WhyDonate has made such a huge difference for me. I’m truly grateful for this platform and everyone who has supported me through it.</blockquote>
                                                                    <div class="dt-foot">
                                                                        <div class="who">
                                                                            <span aria-hidden="true" class="av">N</span>
                                                                            <div>
                                                                                <div class="n">Nil</div>
                                                                                <div class="r">Verified review</div>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <a target="_blank" rel="noopener noreferrer" class="dt-link" href="https://www.trustpilot.com/reviews/6a7b11105594be57fb77bc5a">
                                                                            Trustpilot<span aria-hidden="true" class="msi">open_in_new</span>
                                                                        </a>
                                                                        <!---->
                                                                    </div>
                                                                </article>
                                                                <article class="dark-testi">
                                                                    <div class="dt-top">
                                                                        <div aria-hidden="true" class="stars">★★★★★</div>
                                                                        <!---->
                                                                    </div>
                                                                    <h3 class="dt-title">Fantastic experience!</h3>
                                                                    <!---->
                                                                    <blockquote>I had a fantastic experience with the customer service team! They went above and beyond to resolve my issue quickly and efficiently. The representative was incredibly patient and knowledgeable. It is rare to find this level of care and professionalism these days. Highly recommended!</blockquote>
                                                                    <div class="dt-foot">
                                                                        <div class="who">
                                                                            <span aria-hidden="true" class="av">C</span>
                                                                            <div>
                                                                                <div class="n">Chrisma Briedenhann</div>
                                                                                <div class="r">Verified review</div>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <a target="_blank" rel="noopener noreferrer" class="dt-link" href="https://www.trustpilot.com/reviews/6a74a4d07a670e87b76802cc">
                                                                            Trustpilot<span aria-hidden="true" class="msi">open_in_new</span>
                                                                        </a>
                                                                        <!---->
                                                                    </div>
                                                                </article>
                                                                <article class="dark-testi">
                                                                    <div class="dt-top">
                                                                        <div aria-hidden="true" class="stars">★★★★★</div>
                                                                        <!---->
                                                                    </div>
                                                                    <h3 class="dt-title">Kind, caring and supportive.</h3>
                                                                    <!---->
                                                                    <blockquote>WhyDonate doesn't just give you a platform to raise money for your cause, they also have a great customer service team. They are quick to answer your questions, kind, considerate and also can help you promote your cause too. Highly recommended.</blockquote>
                                                                    <div class="dt-foot">
                                                                        <div class="who">
                                                                            <span aria-hidden="true" class="av">T</span>
                                                                            <div>
                                                                                <div class="n">Tanith</div>
                                                                                <div class="r">Verified review</div>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <a target="_blank" rel="noopener noreferrer" class="dt-link" href="https://www.trustpilot.com/reviews/6a5a9459974a684fd9bc8a45">
                                                                            Trustpilot<span aria-hidden="true" class="msi">open_in_new</span>
                                                                        </a>
                                                                        <!---->
                                                                    </div>
                                                                </article>
                                                                <article class="dark-testi">
                                                                    <div class="dt-top">
                                                                        <div aria-hidden="true" class="stars">★★★★★</div>
                                                                        <!---->
                                                                    </div>
                                                                    <h3 class="dt-title">Lovely experience</h3>
                                                                    <!---->
                                                                    <blockquote>I had such a lovely, positive experience using WhyDonate for my fundraiser. The site was super easy to set-up, and I was very grateful for the support and visibility it provided. The team is also kind and respectful. I was originally nervous and anxious to fundraise but thanks to WhyDonate I was able to reach my goal. I would definitely recommend the platform to others looking to start a fundraiser</blockquote>
                                                                    <div class="dt-foot">
                                                                        <div class="who">
                                                                            <span aria-hidden="true" class="av">E</span>
                                                                            <div>
                                                                                <div class="n">Erna</div>
                                                                                <div class="r">Verified review</div>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <a target="_blank" rel="noopener noreferrer" class="dt-link" href="https://www.trustpilot.com/reviews/6a5f2ddb3a705a9260333e1b">
                                                                            Trustpilot<span aria-hidden="true" class="msi">open_in_new</span>
                                                                        </a>
                                                                        <!---->
                                                                    </div>
                                                                </article>
                                                                <article class="dark-testi">
                                                                    <div class="dt-top">
                                                                        <div aria-hidden="true" class="stars">★★★★★</div>
                                                                        <!---->
                                                                    </div>
                                                                    <h3 class="dt-title">The platform was easy to use</h3>
                                                                    <!---->
                                                                    <blockquote>The platform was easy to use and overall I had a good experience. The process was simple, communication was clear, and everything worked as expected in the end. Customer support was helpful and responsive. There were a few delays, but overall the experience was positive and professional.</blockquote>
                                                                    <div class="dt-foot">
                                                                        <div class="who">
                                                                            <span aria-hidden="true" class="av">I</span>
                                                                            <div>
                                                                                <div class="n">Ivana Pavelic</div>
                                                                                <div class="r">Verified review</div>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <a target="_blank" rel="noopener noreferrer" class="dt-link" href="https://www.trustpilot.com/reviews/6a194f7b1dc3d2db90754564">
                                                                            Trustpilot<span aria-hidden="true" class="msi">open_in_new</span>
                                                                        </a>
                                                                        <!---->
                                                                    </div>
                                                                </article>
                                                                <!---->
                                                            </div>
                                                            <!---->
                                                            <div class="trust-review-cta">
                                                                <span>Raised with WhyDonate?</span>
                                                                <a target="_blank" rel="noopener noreferrer" href="https://www.trustpilot.com/review/whydonate.com">
                                                                    Leave us a review 
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                                        <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                                                                    </svg>
                                                                </a>
                                                            </div>
                                                            <!---->
                                                        </div>
                                                    </section>
                                                </app-home-trust-block>
                                                <!--ngh=d5-->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                            </app-dynamic-block>
                                            <app-dynamic-block _ngcontent-ng-c3822806064 _nghost-ng-c1846917774 ngh="23">
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <app-home-global-block _ngcontent-ng-c1846917774 class="wd-home" ngh="22">
                                                    <section class="cream global">
                                                        <div aria-hidden="true" class="global-bg">
                                                            <div class="dots"></div>
                                                        </div>
                                                        <div class="container">
                                                            <div class="global-head">
                                                                <span class="eyebrow">We're global</span>
                                                                <!---->
                                                                <app-ua-heading fallbacktag="h2" ngh="8">
                                                                    <!---->
                                                                    <h2>
                                                                        <span>
                                                                            Online fundraising for <em>anyone, anywhere.</em>
                                                                        </span>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                    </h2>
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                </app-ua-heading>
                                                                <app-ua-heading fallbacktag="p" hclass="sub" ngh="5">
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <div class="sub">
                                                                        <span>Born in Amsterdam in 2012, WhyDonate now powers fundraisers across 100+ countries — so anyone, anywhere can give in their own language and currency.</span>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                    </div>
                                                                    <!---->
                                                                    <!---->
                                                                </app-ua-heading>
                                                                <!---->
                                                            </div>
                                                            <div class="global-panel">
                                                                <div class="global-statrow">
                                                                    <div class="gstat">
                                                                        <span class="gi">
                                                                            <span aria-hidden="true" class="msi">public</span>
                                                                        </span>
                                                                        <!---->
                                                                        <div class="gn">100+</div>
                                                                        <div class="gl">Countries served</div>
                                                                    </div>
                                                                    <div class="gstat">
                                                                        <span class="gi">
                                                                            <span aria-hidden="true" class="msi">translate</span>
                                                                        </span>
                                                                        <!---->
                                                                        <div class="gn">19</div>
                                                                        <div class="gl">Languages available</div>
                                                                    </div>
                                                                    <div class="gstat">
                                                                        <span class="gi">
                                                                            <span aria-hidden="true" class="msi">payments</span>
                                                                        </span>
                                                                        <!---->
                                                                        <div class="gn">119</div>
                                                                        <div class="gl">Currencies paid out</div>
                                                                    </div>
                                                                    <!---->
                                                                </div>
                                                                <!---->
                                                                <div class="global-langs">
                                                                    <div class="ll-title">Donate in your language</div>
                                                                    <!---->
                                                                    <div class="lang-pills">
                                                                        <span class="lang-pill">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/gb.svg">
                                                                            <!---->
                                                                            <span>English</span>
                                                                        </span>
                                                                        <span class="lang-pill">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/nl.svg">
                                                                            <!---->
                                                                            <span>Nederlands</span>
                                                                        </span>
                                                                        <span class="lang-pill">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/de.svg">
                                                                            <!---->
                                                                            <span>Deutsch</span>
                                                                        </span>
                                                                        <span class="lang-pill">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/fr.svg">
                                                                            <!---->
                                                                            <span>Français</span>
                                                                        </span>
                                                                        <span class="lang-pill">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/es.svg">
                                                                            <!---->
                                                                            <span>Español</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/it.svg">
                                                                            <!---->
                                                                            <span>Italiano</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/pt.svg">
                                                                            <!---->
                                                                            <span>Português</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/pl.svg">
                                                                            <!---->
                                                                            <span>Polski</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/se.svg">
                                                                            <!---->
                                                                            <span>Svenska</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/dk.svg">
                                                                            <!---->
                                                                            <span>Dansk</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/fi.svg">
                                                                            <!---->
                                                                            <span>Suomi</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/cz.svg">
                                                                            <!---->
                                                                            <span>Čeština</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/hu.svg">
                                                                            <!---->
                                                                            <span>Magyar</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/ro.svg">
                                                                            <!---->
                                                                            <span>Română</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/sk.svg">
                                                                            <!---->
                                                                            <span>Slovenčina</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/hr.svg">
                                                                            <!---->
                                                                            <span>Hrvatski</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/bg.svg">
                                                                            <!---->
                                                                            <span>Български</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/gr.svg">
                                                                            <!---->
                                                                            <span>Ελληνικά</span>
                                                                        </span>
                                                                        <span class="lang-pill extra">
                                                                            <img alt loading="lazy" class="flag" src="https://flagcdn.com/ua.svg">
                                                                            <!---->
                                                                            <span>Українська</span>
                                                                        </span>
                                                                        <!---->
                                                                        <span role="button" tabindex="0" class="lang-pill more" aria-expanded="false" jsaction="click:;" ngb="d6">
                                                                            <span class="lbl">+14 more</span>
                                                                            <span aria-hidden="true" class="msi">expand_more</span>
                                                                        </span>
                                                                        <!---->
                                                                    </div>
                                                                </div>
                                                                <!---->
                                                            </div>
                                                        </div>
                                                    </section>
                                                </app-home-global-block>
                                                <!--ngh=d6-->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                            </app-dynamic-block>
                                            <app-dynamic-block _ngcontent-ng-c3822806064 _nghost-ng-c1846917774 ngh="25">
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <app-home-final-cta-block _ngcontent-ng-c1846917774 class="wd-home" ngh="24">
                                                    <section class="final">
                                                        <div class="final-content">
                                                            <div class="final-left">
                                                                <span class="final-badge">
                                                                    <span aria-hidden="true" class="dot"></span>
                                                                    €4,51M raised in the last 90 days 
                                                                </span>
                                                                <!---->
                                                                <app-ua-heading fallbacktag="h2" ngh="8">
                                                                    <!---->
                                                                    <h2>
                                                                        <span>
                                                                            Donate, raise money, and <em>support causes that matter.</em>
                                                                        </span>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                    </h2>
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                    <!---->
                                                                </app-ua-heading>
                                                                <p>Every fundraiser here is someone's real hope — and every donation keeps 100% of its value, because we charge 0% platform fees. Start yours in under five minutes.</p>
                                                                <!---->
                                                                <div class="final-ctas">
                                                                    <a href="/fundraising/start" appstartfundraisercta class="btn btn-white" jsaction="click:;" ngb="d7">Start a Free Fundraiser</a>
                                                                    <!---->
                                                                    <a href="/search" appstartfundraisercta class="btn btn-dark-ghost" jsaction="click:;" ngb="d7">Explore Live Fundraisers</a>
                                                                    <!---->
                                                                </div>
                                                                <div class="final-micro">
                                                                    <span>
                                                                        <span aria-hidden="true" class="msi">check_circle</span>
                                                                        0% platform fee 
                                                                    </span>
                                                                    <span>
                                                                        <span aria-hidden="true" class="msi">check_circle</span>
                                                                        No credit card to start 
                                                                    </span>
                                                                    <span>
                                                                        <span aria-hidden="true" class="msi">check_circle</span>
                                                                        Live in under 5 minutes 
                                                                    </span>
                                                                    <span>
                                                                        <span aria-hidden="true" class="msi">check_circle</span>
                                                                        Human support, 7 days a week 
                                                                    </span>
                                                                    <!---->
                                                                </div>
                                                                <!---->
                                                            </div>
                                                        </div>
                                                    </section>
                                                </app-home-final-cta-block>
                                                <!--ngh=d7-->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                                <!---->
                                            </app-dynamic-block>
                                            <!---->
                                            <!---->
                                        </div>
                                    </app-cms-page>
                                    <!---->
                                </div>
                                <app-footer _ngcontent-ng-c1414614956 id="footer" name="footer" class="mt-auto block w-full" ngh="28">
                                    <footer class="site-footer">
                                        <div class="footer-container">
                                            <div class="foot-grid">
                                                <div class="foot-col">
                                                    <h4>Donate</h4>
                                                    <ul>
                                                        <li>
                                                            <a data-cy="footer-donateGaza" href="https://whydonate.com/donate-to-palestine">Palestine</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-donateUkraine" href="https://whydonate.com/support-ukraine">Ukraine</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-donateFlood" href="https://whydonate.com/financial-help-for-flood-victims">Flood</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-donateColombiaEarthquake" href="https://whydonate.com/colombia-earthquake-relief">Colombia Earthquake</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-fundraisingCategory" href="https://whydonate.com/fundraising-category">More Fundraising Categories</a>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div class="foot-col">
                                                    <h4>Fundraise</h4>
                                                    <ul>
                                                        <li>
                                                            <a data-cy="footer-startWhydonateFundraiser" href="https://whydonate.com/start-whydonate-fundraiser">Start WhyDonate Fundraiser</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-howToSetup" href="https://whydonate.com/how-to-setup-a-fundraiser-on-whydonate">How to Setup a Fundraiser on WhyDonate</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-fundraisingGuides" href="https://whydonate.com/fundraising-guides">Fundraising Guides</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-organisation" href="https://whydonate.com/organisation">Fundraising for Organizations</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-whyTrust" href="https://whydonate.com/why-trust-whydonate">Why Trust WhyDonate</a>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div class="foot-col">
                                                    <h4>Platform Features</h4>
                                                    <ul>
                                                        <li>
                                                            <a data-cy="footer-globalCrowdfunding" href="https://whydonate.com/global-fundraising-europe">Global Crowdfunding</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-customBranding" href="https://whydonate.com/custom-crowdfunding-platform">Custom Branding</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-recurringDonations" href="https://whydonate.com/recurring-donations-giving">Recurring Donations</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-qrCode" href="https://whydonate.com/donation-qr-code-fundraising-charity">QR Code and Payment Requests</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-teamFundraising" href="https://whydonate.com/peer-to-peer-fundraising">Team Fundraising</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-donationFormPlugin" href="https://whydonate.com/donate-button-website">Donation Form Plugin</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-zapierIntegration" href="https://whydonate.com/zapier-integration">Zapier Integration</a>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div class="foot-col">
                                                    <h4>About</h4>
                                                    <ul>
                                                        <li>
                                                            <a data-cy="footer-aboutWhydonate" href="https://whydonate.com/about-whydonate">About WhyDonate</a>
                                                        </li>
                                                        <li>
                                                            <a href="https://helpdesk.whydonate.com/en/">Helpdesk</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-fees" href="https://whydonate.com/fees">Fees</a>
                                                        </li>
                                                        <li>
                                                            <a data-cy="footer-contactUs" href="https://whydonate.com/contact-us">Contact Us</a>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div class="foot-more">
                                                <button class="foot-more-toggle" aria-expanded="false" jsaction="click:;">
                                                    <span>More Resources</span>
                                                    <span class="material-icons-outlined chev">expand_more</span>
                                                </button>
                                                <!---->
                                            </div>
                                            <div class="foot-bottom">
                                                <a aria-label="WhyDonate logo" class="fb-logo" href="https://whydonate.com">
                                                    <img alt="WhyDonate" src="https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/shared/whydonate_lg_logo/public">
                                                </a>
                                                <app-language-chooser _nghost-ng-c116636336 ngh="27">
                                                    <button _ngcontent-ng-c116636336 aria-haspopup="menu" class="cdk-menu-trigger lang-trigger cursor-pointer border-none bg-transparent" role="button" type="button" data-cdk-menu-stack-id="cdk-menu-stack-132" aria-expanded="false" jsaction="focusin:;focusout:;keydown:;click:;">
                                                        <img _ngcontent-ng-c116636336 class="lang-flag" src="https://flagcdn.com/gb.svg" alt="EN">
                                                        <span _ngcontent-ng-c116636336 class="lang-code">En</span>
                                                        <span _ngcontent-ng-c116636336 class="material-icons-outlined chev">arrow_drop_down</span>
                                                    </button>
                                                    <!---->
                                                    <!---->
                                                </app-language-chooser>
                                                <a data-cy="footer-reviews" class="foot-rating" href="https://whydonate.com/reviews">
                                                    <span class="stars">★★★★★</span>
                                                    <span class="rt">4.9 / 5 based on 500+ reviews</span>
                                                </a>
                                                <div class="socials">
                                                    <a href="https://www.instagram.com/whydonate_official/" target="_blank" rel="noopener" aria-label="Instagram">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <rect x="3" y="3" width="18" height="18" rx="5"/>
                                                            <circle cx="12" cy="12" r="4"/>
                                                            <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
                                                        </svg>
                                                    </a>
                                                    <a href="https://x.com/whydonate" target="_blank" rel="noopener" aria-label="X / Twitter">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M18.2 2H21l-7 8 8.3 12H15l-5-7.3L4 22H1l7.5-8.6L0 2h7l4.5 6.6L18.2 2Zm-1 18h2L7 4H5l12.2 16Z"/>
                                                        </svg>
                                                    </a>
                                                    <a href="https://www.facebook.com/WhyDonate/" target="_blank" rel="noopener" aria-label="Facebook">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M22 12a10 10 0 1 0-11.6 9.9V14.9h-2.5V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3V22A10 10 0 0 0 22 12Z"/>
                                                        </svg>
                                                    </a>
                                                    <a href="https://www.linkedin.com/company/whydonate" target="_blank" rel="noopener" aria-label="LinkedIn">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.5 9h5V21h-5V9Zm7.5 0h4.8v1.8h.1c.7-1.3 2.3-2.7 4.7-2.7 5 0 5.9 3.3 5.9 7.6V21h-5v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-5V9Z"/>
                                                        </svg>
                                                    </a>
                                                    <a href="https://www.youtube.com/channel/UCVAdWsKS2W2NEAyjsnCwqxw" target="_blank" rel="noopener" aria-label="YouTube">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.5 3 3 0 0 0 2.1 2.1C4.5 20 12 20 12 20s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.5ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z"/>
                                                        </svg>
                                                    </a>
                                                    <a href="https://www.tiktok.com/@whydonate_official" target="_blank" rel="noopener" aria-label="TikTok">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M16 2h-3v14a2.5 2.5 0 1 1-2.5-2.5c.2 0 .4 0 .5.05V10.5A6 6 0 1 0 16 16.5V8.8a7.3 7.3 0 0 0 4 1.2V7a4.3 4.3 0 0 1-4-3Z"/>
                                                        </svg>
                                                    </a>
                                                </div>
                                            </div>
                                            <div class="foot-legal">
                                                <span>
                                                    © 2012–2026 <a href="https://whydonate.com/">WhyDonate</a>
                                                </span>
                                                <a data-cy="footer-privacyAndCookies" href="https://whydonate.com/privacy-and-cookies">Privacy and cookies</a>
                                                <a data-cy="footer-termsAndConditions" href="https://whydonate.com/terms-and-conditions">Terms and conditions</a>
                                                <a class="cursor-pointer" jsaction="click:;">
                                                    <span class="material-icons-outlined text-18">cookie</span>
                                                    <span>Cookie Settings</span>
                                                </a>
                                                <div class="foot-badges">
                                                    <span class="badge-eu">
                                                        <span class="euflag">★</span>
                                                        <span>Made in Europe</span>
                                                    </span>
                                                    <span class="badge-chip">
                                                        <span class="stripe">stripe</span>
                                                        <span class="vbar"></span>
                                                        <span class="vchk">
                                                            <span class="material-icons-outlined text-14">check</span>
                                                        </span>
                                                        <span>Verified Partner</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </footer>
                                    <!---->
                                    <!---->
                                </app-footer>
                            </div>
                        </div>
                    </app-drawer-content>
                    <!---->
                </app-drawer-container>
            </div>
            <app-cookie-consent _ngcontent-ng-c1414614956 ngskiphydration _nghost-ng-c2212410423>
            <!---->
            </app-cookie-consent>
        </app-root>
        <div id="unsupported-message">
            <p>Unsupported Browser</p>
            <p>This website requires a newer version of iOS to function properly. Please update your device to iOS 12 or later to access WhyDonate.
			</p>
            <p>
                <a href="https://support.apple.com/en-us/HT204204" target="_blank" rel="noopener" class="ios-update-link">Learn how to update your iOS version</a>
            </p>
        </div>
        <script>
            (function() {
                // Show a non-blocking update notice for genuinely outdated iOS (<= 11).
                // Hard rule: this must NEVER hide #app-root or gate non-iOS / modern
                // browsers. The old version hid app-root and polled, which could blank
                // the page on UA edge cases — so the notice is now purely additive.
                var ua = navigator.userAgent || navigator.vendor || '';
                if (!/iPad|iPhone|iPod/.test(ua))
                    return;
                var match = ua.match(/OS (\d+)_/);
                var iOSVersion = match ? parseInt(match[1], 10) : null;
                if (iOSVersion === null || iOSVersion > 11)
                    return;
                var message = document.getElementById('unsupported-message');
                if (message)
                    message.style.display = 'block';
            }
            )();
        </script>
        <link rel="modulepreload" href="chunk-SEQBXQ76.js">
        <link rel="modulepreload" href="chunk-MYDU4OZZ.js">
        <link rel="modulepreload" href="chunk-AIGZD5DM.js">
        <link rel="modulepreload" href="chunk-ENHAJCPN.js">
        <link rel="modulepreload" href="chunk-YAP5YGWZ.js">
        <link rel="modulepreload" href="chunk-UWERH64W.js">
        <link rel="modulepreload" href="chunk-FQPMEBSA.js">
        <link rel="modulepreload" href="chunk-GFU3N2WZ.js">
        <link rel="modulepreload" href="chunk-G5VYBZ5V.js">
        <link rel="modulepreload" href="chunk-P2T6GHOP.js">
        <script src="polyfills-2FBJ5EX2.js" type="module" crossorigin="anonymous"></script>
        <script src="main-ZAHINLV6.js" type="module" crossorigin="anonymous"></script>
        <link rel="modulepreload" href="chunk-B64BBFVF.js">
        <link rel="modulepreload" href="chunk-QODRBXK4.js">
        <link rel="modulepreload" href="chunk-74HIUCTY.js">
        <link rel="modulepreload" href="chunk-TGT7A2MX.js">
        <link rel="modulepreload" href="chunk-O4T5O7AV.js">
        <link rel="modulepreload" href="chunk-4NGH53Q3.js">
        <link rel="modulepreload" href="chunk-EHMI6I65.js">
        <link rel="modulepreload" href="chunk-2WTPOHFH.js">
        <script id="ng-state" type="application/json">
            {
                "0b4a309ba7aed37a12603739987c0d43152340d4f44225ec2da670da6ad73b50": {
                    "b": {
                        "id": 1,
                        "siteName": "WhyDonate",
                        "twitterHandle": "@whydonate",
                        "facebookPageUrl": "https://www.facebook.com/whydonate",
                        "defaultOgImage": 2,
                        "socialLinks": [
                        ],
                        "announcementBar": {
                            "enabled": false,
                            "logoUrl": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/a816071b-ec9d-4d95-455f-549df9ce8200/public",
                            "targetLanguages": null,
                            "targetCountries": null
                        },
                        "headerEmergencyCard": {
                            "enabled": null,
                            "imageUrl": null,
                            "imageCredit": null
                        },
                        "fundraiserCtaCard": {
                            "ctaUrl": null
                        },
                        "translationLocks": [
                        ],
                        "updatedAt": "2026-07-10T11:28:41.642Z",
                        "createdAt": "2026-04-15T22:24:16.155Z",
                        "globalType": "site-settings"
                    },
                    "h": {
                    },
                    "s": 200,
                    "st": "OK",
                    "u": "https://payload-cms.whydonate.workers.dev/api/globals/site-settings?locale=en&fallback-locale=en&depth=0",
                    "rt": "json"
                },
                "69820ea2d2db3a1a22486caacad487a46312f39f2b15feb7c6540a4b582d3404": {
                    "b": "fl=533f99\nh=whydonate.com\nip=2a06:98c0:3600::103\nts=1787749558.271\nvisit_scheme=https\nuag=\ncolo=CDG\nsliver=none\nhttp=unknown\nloc=NL\ntls=off\nsni=off\nwarp=off\ngateway=off\nrbi=off\nkex=none\n",
                    "h": {
                    },
                    "s": 200,
                    "st": "OK",
                    "u": "https://whydonate.com/cdn-cgi/trace",
                    "rt": "text"
                },
                "2e2171ae3375348e03be65e2d2d7bb1209f3b460b98f3ed4744328ce7c8601e1": {
                    "b": {
                        "docs": [
                            {
                                "id": 13,
                                "title": "WhyDonate | Crowdfunding & Online Fundraising Platform",
                                "slug": "home",
                                "meta": {
                                    "title": "WhyDonate | Crowdfunding & Online Fundraising Platform",
                                    "description": "Start a crowdfunding campaign or donate to a charity. WhyDonate is your platform for personal fundraising and supporting good causes globally.",
                                    "keywords": "crowdfunding, online fundraising, donate, charity, fundraiser, 0% platform fee",
                                    "image": null,
                                    "noIndex": false,
                                    "noFollow": false,
                                    "excludeFromSitemap": false,
                                    "ogType": "website",
                                    "twitterCard": "summary_large_image",
                                    "canonicalUrl": null
                                },
                                "layout": [
                                    {
                                        "id": "6a82cc95eac1ed00c8a24450",
                                        "raisedFallback": "4510000",
                                        "titleTag": "h1",
                                        "subTag": "p",
                                        "ctaPrimaryUrl": "/fundraising/start",
                                        "ctaPrimaryUrlNewTab": false,
                                        "galleryImage1": {
                                            "id": 4018,
                                            "alt": "Test",
                                            "cloudflareImageId": "4ac36c90-0332-42f6-8d4a-c55ed5d66000",
                                            "updatedAt": "2026-08-18T14:53:54.850Z",
                                            "createdAt": "2026-08-18T14:52:36.846Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/4ac36c90-0332-42f6-8d4a-c55ed5d66000/public",
                                            "thumbnailURL": null,
                                            "filename": "4ac36c90-0332-42f6-8d4a-c55ed5d66000.png",
                                            "mimeType": "image/jpeg",
                                            "filesize": 2066852,
                                            "width": 1080,
                                            "height": 1920
                                        },
                                        "galleryImage2": {
                                            "id": 4019,
                                            "alt": "Peace Walk",
                                            "cloudflareImageId": "fbd057e7-566d-4d2d-550c-5c74c9dc1c00",
                                            "updatedAt": "2026-08-18T14:53:56.068Z",
                                            "createdAt": "2026-08-18T14:52:37.992Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/fbd057e7-566d-4d2d-550c-5c74c9dc1c00/public",
                                            "thumbnailURL": null,
                                            "filename": "fbd057e7-566d-4d2d-550c-5c74c9dc1c00.png",
                                            "mimeType": "image/jpeg",
                                            "filesize": 1424917,
                                            "width": 1080,
                                            "height": 1920
                                        },
                                        "galleryImage3": {
                                            "id": 4020,
                                            "alt": "Whydonate fundraiser",
                                            "cloudflareImageId": "cdee8fe6-cb40-4414-c432-5d556da24b00",
                                            "updatedAt": "2026-08-18T14:53:56.977Z",
                                            "createdAt": "2026-08-18T14:52:39.833Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cdee8fe6-cb40-4414-c432-5d556da24b00/public",
                                            "thumbnailURL": null,
                                            "filename": "cdee8fe6-cb40-4414-c432-5d556da24b00.png",
                                            "mimeType": "image/jpeg",
                                            "filesize": 1671762,
                                            "width": 1080,
                                            "height": 1920
                                        },
                                        "galleryImage4": {
                                            "id": 4021,
                                            "alt": "test",
                                            "cloudflareImageId": "d4436a66-22a8-4dc7-4047-bfeffa61aa00",
                                            "updatedAt": "2026-08-18T14:53:57.282Z",
                                            "createdAt": "2026-08-18T14:52:40.743Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d4436a66-22a8-4dc7-4047-bfeffa61aa00/public",
                                            "thumbnailURL": null,
                                            "filename": "d4436a66-22a8-4dc7-4047-bfeffa61aa00.png",
                                            "mimeType": "image/jpeg",
                                            "filesize": 725296,
                                            "width": 1080,
                                            "height": 1920
                                        },
                                        "galleryImage5": {
                                            "id": 4022,
                                            "alt": "test",
                                            "cloudflareImageId": "54bddf6b-ca74-42d9-5aa8-c91400df4900",
                                            "updatedAt": "2026-08-18T14:53:57.627Z",
                                            "createdAt": "2026-08-18T14:52:41.148Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/54bddf6b-ca74-42d9-5aa8-c91400df4900/public",
                                            "thumbnailURL": null,
                                            "filename": "54bddf6b-ca74-42d9-5aa8-c91400df4900.png",
                                            "mimeType": "image/jpeg",
                                            "filesize": 1600740,
                                            "width": 1080,
                                            "height": 1920
                                        },
                                        "galleryImage6": {
                                            "id": 4023,
                                            "alt": "runners",
                                            "cloudflareImageId": "2d923bd9-7c43-4aaa-205e-1a99efb94a00",
                                            "updatedAt": "2026-08-18T14:53:58.902Z",
                                            "createdAt": "2026-08-18T14:52:41.516Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2d923bd9-7c43-4aaa-205e-1a99efb94a00/public",
                                            "thumbnailURL": null,
                                            "filename": "2d923bd9-7c43-4aaa-205e-1a99efb94a00.png",
                                            "mimeType": "image/jpeg",
                                            "filesize": 1300901,
                                            "width": 1080,
                                            "height": 1920
                                        },
                                        "galleryImage7": {
                                            "id": 4024,
                                            "alt": "Get School Tuitions, shoes and meals for a community in Nairobi-Kenya",
                                            "cloudflareImageId": "d83a5daf-7f20-4076-79da-c66c822b1700",
                                            "updatedAt": "2026-08-18T14:54:00.085Z",
                                            "createdAt": "2026-08-18T14:52:41.864Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/d83a5daf-7f20-4076-79da-c66c822b1700/public",
                                            "thumbnailURL": null,
                                            "filename": "d83a5daf-7f20-4076-79da-c66c822b1700.png",
                                            "mimeType": "image/jpeg",
                                            "filesize": 1673892,
                                            "width": 1080,
                                            "height": 1920
                                        },
                                        "galleryImage8": {
                                            "id": 4025,
                                            "alt": "Let's gather around Tegest",
                                            "cloudflareImageId": "27dcaae0-ea11-40d1-1978-33cdf92f5300",
                                            "updatedAt": "2026-08-18T14:54:00.400Z",
                                            "createdAt": "2026-08-18T14:52:43.097Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/27dcaae0-ea11-40d1-1978-33cdf92f5300/public",
                                            "thumbnailURL": null,
                                            "filename": "27dcaae0-ea11-40d1-1978-33cdf92f5300.png",
                                            "mimeType": "image/jpeg",
                                            "filesize": 1454930,
                                            "width": 1080,
                                            "height": 1920
                                        },
                                        "galleryImage9": {
                                            "id": 4026,
                                            "alt": "Lorna Butler",
                                            "cloudflareImageId": "cbeca6e7-e3fa-46c6-ecbd-f8b222b05700",
                                            "updatedAt": "2026-08-18T14:54:00.679Z",
                                            "createdAt": "2026-08-18T14:52:44.074Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/cbeca6e7-e3fa-46c6-ecbd-f8b222b05700/public",
                                            "thumbnailURL": null,
                                            "filename": "cbeca6e7-e3fa-46c6-ecbd-f8b222b05700.png",
                                            "mimeType": "image/jpeg",
                                            "filesize": 1525937,
                                            "width": 1080,
                                            "height": 1920
                                        },
                                        "galleryImage10": {
                                            "id": 4027,
                                            "alt": "Joris Luyendijk",
                                            "cloudflareImageId": "86634936-fe01-4769-5880-7230b6f1a100",
                                            "updatedAt": "2026-08-18T14:54:00.965Z",
                                            "createdAt": "2026-08-18T14:52:44.404Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/86634936-fe01-4769-5880-7230b6f1a100/public",
                                            "thumbnailURL": null,
                                            "filename": "86634936-fe01-4769-5880-7230b6f1a100.png",
                                            "mimeType": "image/jpeg",
                                            "filesize": 1179900,
                                            "width": 1080,
                                            "height": 1920
                                        },
                                        "blockName": null,
                                        "blockType": "homeHero",
                                        "raisedLabel": "raised in the last 90 days",
                                        "heading": "Simple fundraising for causes that \u003Cem>matter most.\u003C/em>",
                                        "sub": "With \u003Cstrong>0% platform fees\u003C/strong> and a community of \u003Cstrong>{donors} donors\u003C/strong>, launch your fundraiser in minutes and share your cause with the world. Get the support your cause deserves.",
                                        "ctaPrimaryLabel": "Start Your Free Fundraiser",
                                        "ctaMeta": "\u003Cstrong>0% platform fee.\u003C/strong> Starting a fundraiser is free — standard processing fees of €0,25 + 1.9% per donation apply.",
                                        "cuesJson": "[{\"icon\":\"verified_user\",\"label\":\"Secure platform\"},{\"icon\":\"trophy\",\"label\":\"Europe's #1 crowdfunding platform\"},{\"icon\":\"paid\",\"label\":\"0% platform fee\"},{\"icon\":\"headset_mic\",\"label\":\"Expert support\"}]",
                                        "galleryJson": "[{\"src\":\"https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/whydonate.com/2019/07/photo-1517918810404-ef1d308d1175-1.jpeg/public\",\"alt\":\"\"},{\"src\":\"https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/whydonate.com/2019/07/photo-1549032305-e816fabf0dd2-1.jpeg/public\",\"alt\":\"\"},{\"src\":\"https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/whydonate.com/2019/07/photo-1516749712236-67f5688a642a-1.jpeg/public\",\"alt\":\"\"},{\"src\":\"https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/whydonate.com/2019/07/photo-1544531586-fde5298cdd40-1.jpeg/public\",\"alt\":\"\"}]"
                                    },
                                    {
                                        "id": "6a82cc95eac1ed00c8a24451",
                                        "headingTag": "h2",
                                        "ctaUrl": "/search",
                                        "ctaUrlNewTab": false,
                                        "blockName": null,
                                        "blockType": "homeFundraisers",
                                        "eyebrow": "Live now",
                                        "heading": "Live fundraisers\u003Cem>, raising right now.\u003C/em>",
                                        "allTabLabel": "All",
                                        "raisedOfLabel": "raised of {goal}",
                                        "donorsLabel": "{count} donors",
                                        "daysLeftLabel": "{days} days left",
                                        "emptyLabel": "No live fundraisers to show right now.",
                                        "ctaLabel": "View all campaigns"
                                    },
                                    {
                                        "id": "6a82cc95eac1ed00c8a24452",
                                        "headingTag": "h2",
                                        "introTag": "p",
                                        "autoAdvanceMs": 5200,
                                        "blockName": null,
                                        "blockType": "homeHow",
                                        "eyebrow": "How it works",
                                        "heading": "Start an online fundraiser and raise money in \u003Cem>under 5 minutes.\u003C/em>",
                                        "intro": "No paperwork. No platform cut. Just your story, your supporters, and the funds you need.",
                                        "stepsJson": "[{\"icon\":\"rocket_launch\",\"title\":\"Start a fundraiser\",\"desc\":\"Sign up on WhyDonate and create your fundraiser in minutes — as an individual or an organisation.\"},{\"icon\":\"share\",\"title\":\"Share your fundraiser\",\"desc\":\"Share with friends and your network through Facebook, TikTok, Instagram, WhatsApp and more.\"},{\"icon\":\"trending_up\",\"title\":\"Raise funds\",\"desc\":\"Watch donations roll in as your story spreads — every contribution counts toward your goal.\"},{\"icon\":\"account_balance_wallet\",\"title\":\"Receive donations\",\"desc\":\"Funds settle directly into your account — choose weekly, monthly, or instant payouts.\"},{\"icon\":\"favorite\",\"title\":\"Thank your donors\",\"desc\":\"Send personalised automated thank-you emails to every donor straight from your dashboard.\"}]",
                                        "panelsJson": "{\"p0\":{\"head\":\"Create your fundraiser\",\"coverImg\":\"https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=85\",\"coverBadge\":\"Cover uploaded\",\"categories\":[{\"label\":\"Medical\",\"icon\":\"favorite\",\"on\":true},{\"label\":\"Community\"},{\"label\":\"Animals\"}],\"fieldLabel\":\"Fundraiser title\",\"typed\":\"A new life for Mum\",\"cta\":\"Publish fundraiser\"},\"p1\":{\"head\":\"Share your link\",\"link\":\"whydonate.com/f/new-life-mum\",\"copyLabel\":\"Copy\",\"copiedLabel\":\"Link copied to clipboard\",\"chips\":[{\"label\":\"WhatsApp\",\"brand\":\"whatsapp\"},{\"label\":\"Instagram\",\"brand\":\"instagram\"},{\"label\":\"Facebook\",\"brand\":\"facebook\"},{\"label\":\"TikTok\",\"brand\":\"tiktok\"},{\"label\":\"Nextdoor\",\"brand\":\"nextdoor\"},{\"label\":\"Email\",\"icon\":\"mail\"}]},\"p2\":{\"head\":\"Donations rolling in\",\"amount\":\"€13,600\",\"ofGoal\":\"raised of €20,000\",\"pct\":\"68%\",\"donorsLabel\":\"284 donors\",\"daysLabel\":\"18 days left\",\"donors\":[{\"name\":\"Tomas R.\",\"action\":\"just donated\",\"amount\":\"€50\",\"img\":\"\"},{\"name\":\"Suchi K.\",\"action\":\"just donated\",\"amount\":\"€25\",\"img\":\"\"},{\"name\":\"Anna V.\",\"action\":\"just donated\",\"amount\":\"€100\",\"img\":\"\"}]},\"p3\":{\"head\":\"Payout to your account\",\"transferred\":\"€13,600 transferred\",\"account\":\"to •••• 4291 · today\",\"options\":[{\"icon\":\"bolt\",\"title\":\"Instant payout\",\"sub\":\"Funds in your account in minutes\",\"on\":true},{\"icon\":\"calendar_month\",\"title\":\"Weekly payout\",\"sub\":\"Every Monday, automatically\"}],\"feeNote\":\"0% platform fee — you keep every cent\"},\"p4\":{\"head\":\"Thank your donors\",\"to\":\"To: 284 donors\",\"sentLabel\":\"Sent\",\"subject\":\"Thank you for giving Mum a second chance\",\"body\":\"Dear supporter — because of you, we reached our goal. Mum’s transplant is scheduled and we cannot thank you enough for standing with our family…\",\"cta\":\"Write thank you messages\"}}"
                                    },
                                    {
                                        "id": "6a82cc95eac1ed00c8a24453",
                                        "labelIcon": "verified_user",
                                        "methodImage1": {
                                            "id": 4028,
                                            "alt": "iDEAL payment method logo",
                                            "cloudflareImageId": "44a56fe9-d140-48e5-ac6e-2723794be700",
                                            "updatedAt": "2026-08-19T12:54:00.636Z",
                                            "createdAt": "2026-08-19T12:54:00.636Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/44a56fe9-d140-48e5-ac6e-2723794be700/public",
                                            "thumbnailURL": null,
                                            "filename": "ideal.png",
                                            "mimeType": "image/png",
                                            "filesize": 57714,
                                            "width": 1920,
                                            "height": 728
                                        },
                                        "methodImage2": {
                                            "id": 4029,
                                            "alt": "Swish payment method logo",
                                            "cloudflareImageId": "2a12c07e-d3e0-4c1c-2fb8-23d560a14900",
                                            "updatedAt": "2026-08-19T12:54:12.680Z",
                                            "createdAt": "2026-08-19T12:54:12.680Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/2a12c07e-d3e0-4c1c-2fb8-23d560a14900/public",
                                            "thumbnailURL": null,
                                            "filename": "swish.png",
                                            "mimeType": "image/png",
                                            "filesize": 72762,
                                            "width": 720,
                                            "height": 220
                                        },
                                        "methodImage3": {
                                            "id": 4030,
                                            "alt": "BLIK payment method logo",
                                            "cloudflareImageId": "0b5b8b48-8dbe-4da7-b540-f09939649400",
                                            "updatedAt": "2026-08-19T12:54:14.180Z",
                                            "createdAt": "2026-08-19T12:54:14.180Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/0b5b8b48-8dbe-4da7-b540-f09939649400/public",
                                            "thumbnailURL": null,
                                            "filename": "blik.webp",
                                            "mimeType": "image/webp",
                                            "filesize": 22090,
                                            "width": 1280,
                                            "height": 606
                                        },
                                        "methodImage4": {
                                            "id": 4031,
                                            "alt": "Przelewy24 payment method logo",
                                            "cloudflareImageId": "bb9584e9-abd9-4bd8-e92f-373ad8d66f00",
                                            "updatedAt": "2026-08-19T12:54:15.395Z",
                                            "createdAt": "2026-08-19T12:54:15.395Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/bb9584e9-abd9-4bd8-e92f-373ad8d66f00/public",
                                            "thumbnailURL": null,
                                            "filename": "przelewy24.png",
                                            "mimeType": "image/png",
                                            "filesize": 67946,
                                            "width": 880,
                                            "height": 297
                                        },
                                        "methodImage5": {
                                            "id": 4032,
                                            "alt": "Carte Bancaire payment method logo",
                                            "cloudflareImageId": "c90d227c-235e-4b22-2d1c-b87b09882300",
                                            "updatedAt": "2026-08-19T12:54:16.739Z",
                                            "createdAt": "2026-08-19T12:54:16.739Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/c90d227c-235e-4b22-2d1c-b87b09882300/public",
                                            "thumbnailURL": null,
                                            "filename": "carte-bancaire.png",
                                            "mimeType": "image/png",
                                            "filesize": 141963,
                                            "width": 800,
                                            "height": 520
                                        },
                                        "methodImage6": {
                                            "id": 4033,
                                            "alt": "EPS payment method logo",
                                            "cloudflareImageId": "09f42aa5-88a3-4d8b-2833-a842d96d0400",
                                            "updatedAt": "2026-08-19T12:54:18.053Z",
                                            "createdAt": "2026-08-19T12:54:18.053Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/09f42aa5-88a3-4d8b-2833-a842d96d0400/public",
                                            "thumbnailURL": null,
                                            "filename": "eps.png",
                                            "mimeType": "image/png",
                                            "filesize": 67594,
                                            "width": 770,
                                            "height": 474
                                        },
                                        "methodImage7": {
                                            "id": 4034,
                                            "alt": "MB WAY payment method logo",
                                            "cloudflareImageId": "60e3c7d3-2f52-4a7e-ecf8-3816ee79b100",
                                            "updatedAt": "2026-08-19T12:54:19.253Z",
                                            "createdAt": "2026-08-19T12:54:19.253Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/60e3c7d3-2f52-4a7e-ecf8-3816ee79b100/public",
                                            "thumbnailURL": null,
                                            "filename": "mbway.png",
                                            "mimeType": "image/png",
                                            "filesize": 48678,
                                            "width": 880,
                                            "height": 428
                                        },
                                        "methodImage8": {
                                            "id": 4035,
                                            "alt": "Satispay payment method logo",
                                            "cloudflareImageId": "6cdf5ac2-ed95-4bde-4ac9-b60da39dca00",
                                            "updatedAt": "2026-08-19T12:54:20.436Z",
                                            "createdAt": "2026-08-19T12:54:20.436Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/6cdf5ac2-ed95-4bde-4ac9-b60da39dca00/public",
                                            "thumbnailURL": null,
                                            "filename": "satispay.png",
                                            "mimeType": "image/png",
                                            "filesize": 85934,
                                            "width": 656,
                                            "height": 159
                                        },
                                        "methodImage9": {
                                            "id": 4036,
                                            "alt": "TWINT payment method logo",
                                            "cloudflareImageId": "7d5d3ced-b642-4674-cf82-92144d7d6100",
                                            "updatedAt": "2026-08-19T12:54:21.544Z",
                                            "createdAt": "2026-08-19T12:54:21.544Z",
                                            "url": "https://imagedelivery.net/_0vgnXOEIHPwLg2E52a7gg/7d5d3ced-b642-4674-cf82-92144d7d6100/public",
                                            "thumbnailURL": null,
                                            "filename": "twint.webp",
                                            "mimeType": "image/webp",
                                            "filesize": 13566,
                                            "width": 960,
                                            "height": 316
                                        },
                                        "methodImage10": null,
                                        "methodImage11": null,
                                        "methodImage12": null,
                                        "blockName": null,
                                        "blockType": "homePayments",
                                        "label": "Trusted payment method",
                                        "badgePrimary": "stripe",
                                        "badgeSecondary": "Verified Partner",
                                        "methodsLabel": "Accepted payment methods",
                                        "methodsJson": "[{\"label\":\"iDEAL\",\"logo\":\"\",\"cc\":\"NL\"},{\"label\":\"Swish\",\"logo\":\"\",\"cc\":\"SE\"},{\"label\":\"BLIK\",\"logo\":\"\",\"cc\":\"PL\"},{\"label\":\"Przelewy24\",\"logo\":\"\",\"cc\":\"PL\"},{\"label\":\"Carte Bancaire\",\"logo\":\"\",\"cc\":\"FR\"},{\"label\":\"EPS\",\"logo\":\"\",\"cc\":\"AT\"},{\"label\":\"MB WAY\",\"logo\":\"\",\"cc\":\"PT\"},{\"label\":\"Satispay\",\"logo\":\"\",\"cc\":\"IT\"},{\"label\":\"TWINT\",\"logo\":\"\",\"cc\":\"CH\"}]"
                                    },
                                    {
                                        "id": "6a82cc95eac1ed00c8a24454",
                                        "background": "default",
                                        "headingTag": "h2",
                                        "introTag": "p",
                                        "cardImage1": null,
                                        "cardImage2": null,
                                        "cardImage3": null,
                                        "cardImage4": null,
                                        "cardImage5": null,
                                        "cardImage6": null,
                                        "blockName": null,
                                        "blockType": "homeTopics",
                                        "eyebrow": "Featured topics",
                                        "heading": "Raise money for the causes that \u003Cem>matter most.\u003C/em>",
                                        "intro": "The needs we see most often on WhyDonate — explore where your support goes furthest right now.",
                                        "cardsJson": "[{\"img\":\"https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=600&q=85\",\"alt\":\"\",\"title\":\"Medical & health\",\"desc\":\"Treatments, surgeries and recovery funds for people who simply can't wait for help to arrive.\",\"count\":\"8420\",\"linkLabel\":\"Explore medical causes\",\"url\":\"/search?category=10\"},{\"img\":\"https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=600&q=85\",\"alt\":\"\",\"title\":\"Memorials & funerals\",\"desc\":\"Honour someone you've lost and ease the unexpected costs for the family they leave behind.\",\"count\":\"3210\",\"linkLabel\":\"Explore memorials\",\"url\":\"/search?category=9\"},{\"img\":\"https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=85\",\"alt\":\"\",\"title\":\"Emergency & relief\",\"desc\":\"Rapid support when disaster strikes — floods, fires and crises that cannot wait.\",\"count\":\"2140\",\"linkLabel\":\"Explore emergency causes\",\"url\":\"/search?category=4\"}]",
                                        "countSuffix": "live"
                                    },
                                    {
                                        "id": "6a82cc95eac1ed00c8a24455",
                                        "headingTag": "h2",
                                        "introTag": "p",
                                        "blockName": null,
                                        "blockType": "homeFeatures",
                                        "eyebrow": "Platform features",
                                        "heading": "Everything you need for \u003Cem>successful online fundraising.\u003C/em>",
                                        "intro": "From launch to donations, everything is built to help you succeed.",
                                        "cardsJson": "[{\"icon\":\"movie\",\"title\":\"Promote with video & social\",\"desc\":\"Add a video to your story and share to WhatsApp, Instagram, Facebook and more in one tap — the campaigns that show, raise more.\"},{\"icon\":\"autorenew\",\"title\":\"Recurring donations\",\"desc\":\"Monthly giving with auto-retry, dunning, and donor self-service. Set it and grow.\",\"linkLabel\":\"See how recurring giving works\",\"navKey\":\"recurringDonations\"},{\"icon\":\"palette\",\"title\":\"Custom branding\",\"desc\":\"Your colours, your logo, your domain. Make your fundraiser look like an extension of you.\",\"linkLabel\":\"Explore custom branding\",\"navKey\":\"customBranding\"},{\"icon\":\"monitoring\",\"title\":\"Analytics dashboard\",\"desc\":\"See where every donation comes from — with native Google Analytics support to track and optimise the channels that convert.\"},{\"icon\":\"mail\",\"title\":\"Automated thank-you emails\",\"desc\":\"Personalised emails fire automatically the moment a donation lands. Donors feel seen.\"},{\"icon\":\"support_agent\",\"title\":\"Human support, 7 days a week\",\"desc\":\"Real people — not bots — on chat and email every day of the year, ready to help your campaign succeed.\",\"linkLabel\":\"Get in touch\",\"navKey\":\"contactUs\"}]"
                                    },
                                    {
                                        "id": "6a82cc95eac1ed00c8a24456",
                                        "headingTag": "h2",
                                        "subTag": "p",
                                        "reviewCtaUrl": "https://www.trustpilot.com/review/whydonate.com",
                                        "blockName": null,
                                        "blockType": "homeTrust",
                                        "eyebrow": "Trust & safety",
                                        "heading": "\u003Cem>Trusted crowdfunding platform\u003C/em> since 2012.",
                                        "sub": "Over a decade of secure fundraising — and independently rated by the people who've used us.",
                                        "pillsJson": "[{\"icon\":\"lock\",\"label\":\"Secure payments via Stripe\"},{\"icon\":\"verified_user\",\"label\":\"Verified fundraisers\"},{\"icon\":\"encrypted\",\"label\":\"GDPR compliant\"}]",
                                        "statsJson": "[{\"key\":\"donors\",\"value\":\"1,69M\",\"label\":\"Donors worldwide\",\"live\":true},{\"key\":\"fundraisers\",\"value\":\"128,471\",\"label\":\"Fundraisers supported\",\"live\":true},{\"key\":\"years\",\"value\":\"{years}+ yrs\",\"label\":\"Since 2012\",\"foundedYear\":2012}]",
                                        "testimonialsLabel": "What our customers say",
                                        "quotesJson": "[{\"title\":\"I’m so happy with WhyDonate\",\"text\":\"I’m so happy with WhyDonate! I live in a country where international fundraising is extremely difficult, so having a platform like WhyDonate has made such a huge difference for me. I’m truly grateful for this platform and everyone who has supported me through it.\",\"name\":\"Nil\",\"initials\":\"N\",\"role\":\"Verified review\",\"source\":\"Trustpilot\",\"url\":\"https://www.trustpilot.com/reviews/6a7b11105594be57fb77bc5a\",\"lang\":\"en\"},{\"title\":\"Fantastic experience!\",\"text\":\"I had a fantastic experience with the customer service team! They went above and beyond to resolve my issue quickly and efficiently. The representative was incredibly patient and knowledgeable. It is rare to find this level of care and professionalism these days. Highly recommended!\",\"name\":\"Chrisma Briedenhann\",\"initials\":\"C\",\"role\":\"Verified review\",\"source\":\"Trustpilot\",\"url\":\"https://www.trustpilot.com/reviews/6a74a4d07a670e87b76802cc\",\"lang\":\"en\"},{\"title\":\"Kind, caring and supportive.\",\"text\":\"WhyDonate doesn't just give you a platform to raise money for your cause, they also have a great customer service team. They are quick to answer your questions, kind, considerate and also can help you promote your cause too. Highly recommended.\",\"name\":\"Tanith\",\"initials\":\"T\",\"role\":\"Verified review\",\"source\":\"Trustpilot\",\"url\":\"https://www.trustpilot.com/reviews/6a5a9459974a684fd9bc8a45\",\"lang\":\"en\"},{\"title\":\"Lovely experience\",\"text\":\"I had such a lovely, positive experience using WhyDonate for my fundraiser. The site was super easy to set-up, and I was very grateful for the support and visibility it provided. The team is also kind and respectful. I was originally nervous and anxious to fundraise but thanks to WhyDonate I was able to reach my goal. I would definitely recommend the platform to others looking to start a fundraiser\",\"name\":\"Erna\",\"initials\":\"E\",\"role\":\"Verified review\",\"source\":\"Trustpilot\",\"url\":\"https://www.trustpilot.com/reviews/6a5f2ddb3a705a9260333e1b\",\"lang\":\"en\"},{\"title\":\"The platform was easy to use\",\"text\":\"The platform was easy to use and overall I had a good experience. The process was simple, communication was clear, and everything worked as expected in the end. Customer support was helpful and responsive. There were a few delays, but overall the experience was positive and professional.\",\"name\":\"Ivana Pavelic\",\"initials\":\"I\",\"role\":\"Verified review\",\"source\":\"Trustpilot\",\"url\":\"https://www.trustpilot.com/reviews/6a194f7b1dc3d2db90754564\",\"lang\":\"en\"}]"
                                    },
                                    {
                                        "id": "6a82cc95eac1ed00c8a24457",
                                        "headingTag": "h2",
                                        "introTag": "p",
                                        "languagesJson": "[{\"label\":\"English\",\"flag\":\"https://flagcdn.com/gb.svg\"},{\"label\":\"Nederlands\",\"flag\":\"https://flagcdn.com/nl.svg\"},{\"label\":\"Deutsch\",\"flag\":\"https://flagcdn.com/de.svg\"},{\"label\":\"Français\",\"flag\":\"https://flagcdn.com/fr.svg\"},{\"label\":\"Español\",\"flag\":\"https://flagcdn.com/es.svg\"},{\"label\":\"Italiano\",\"flag\":\"https://flagcdn.com/it.svg\"},{\"label\":\"Português\",\"flag\":\"https://flagcdn.com/pt.svg\"},{\"label\":\"Polski\",\"flag\":\"https://flagcdn.com/pl.svg\"},{\"label\":\"Svenska\",\"flag\":\"https://flagcdn.com/se.svg\"},{\"label\":\"Dansk\",\"flag\":\"https://flagcdn.com/dk.svg\"},{\"label\":\"Suomi\",\"flag\":\"https://flagcdn.com/fi.svg\"},{\"label\":\"Čeština\",\"flag\":\"https://flagcdn.com/cz.svg\"},{\"label\":\"Magyar\",\"flag\":\"https://flagcdn.com/hu.svg\"},{\"label\":\"Română\",\"flag\":\"https://flagcdn.com/ro.svg\"},{\"label\":\"Slovenčina\",\"flag\":\"https://flagcdn.com/sk.svg\"},{\"label\":\"Hrvatski\",\"flag\":\"https://flagcdn.com/hr.svg\"},{\"label\":\"Български\",\"flag\":\"https://flagcdn.com/bg.svg\"},{\"label\":\"Ελληνικά\",\"flag\":\"https://flagcdn.com/gr.svg\"},{\"label\":\"Українська\",\"flag\":\"https://flagcdn.com/ua.svg\"}]",
                                        "blockName": null,
                                        "blockType": "homeGlobal",
                                        "eyebrow": "We're global",
                                        "heading": "Online fundraising for \u003Cem>anyone, anywhere.\u003C/em>",
                                        "intro": "Born in Amsterdam in 2012, WhyDonate now powers fundraisers across 100+ countries — so anyone, anywhere can give in their own language and currency.",
                                        "statsJson": "[{\"key\":\"countries\",\"value\":\"100+\",\"label\":\"Countries served\",\"icon\":\"public\"},{\"key\":\"languages\",\"value\":\"19\",\"label\":\"Languages available\",\"icon\":\"translate\"},{\"key\":\"currencies\",\"value\":\"119\",\"label\":\"Currencies paid out\",\"icon\":\"payments\"}]",
                                        "languagesLabel": "Donate in your language"
                                    },
                                    {
                                        "id": "6a82cc95eac1ed00c8a24458",
                                        "raisedFallback": "4510000",
                                        "headingTag": "h2",
                                        "ctaPrimaryUrl": "/fundraising/start",
                                        "ctaPrimaryUrlNewTab": false,
                                        "ctaSecondaryUrl": "/search",
                                        "ctaSecondaryUrlNewTab": false,
                                        "blockName": null,
                                        "blockType": "homeFinalCta",
                                        "badgeLabel": "raised in the last 90 days",
                                        "heading": "Donate, raise money, and \u003Cem>support causes that matter.\u003C/em>",
                                        "text": "Every fundraiser here is someone's real hope — and every donation keeps 100% of its value, because we charge 0% platform fees. Start yours in under five minutes.",
                                        "ctaPrimaryLabel": "Start a Free Fundraiser",
                                        "ctaSecondaryLabel": "Explore Live Fundraisers",
                                        "microJson": "[{\"icon\":\"check_circle\",\"label\":\"0% platform fee\"},{\"icon\":\"check_circle\",\"label\":\"No credit card to start\"},{\"icon\":\"check_circle\",\"label\":\"Live in under 5 minutes\"},{\"icon\":\"check_circle\",\"label\":\"Human support, 7 days a week\"}]"
                                    }
                                ],
                                "authorProfile": null,
                                "author": {
                                    "name": null,
                                    "url": null,
                                    "jobTitle": null,
                                    "bio": null,
                                    "image": null
                                },
                                "updatedAt": "2026-08-20T09:50:03.912Z",
                                "createdAt": "2026-08-17T08:55:45.484Z"
                            }
                        ],
                        "hasNextPage": false,
                        "hasPrevPage": false,
                        "limit": 1,
                        "nextPage": null,
                        "page": 1,
                        "pagingCounter": 1,
                        "prevPage": null,
                        "totalDocs": 1,
                        "totalPages": 1
                    },
                    "h": {
                    },
                    "s": 200,
                    "st": "OK",
                    "u": "https://payload-cms.whydonate.workers.dev/api/pages?where[slug][equals]=home&locale=en&fallback-locale=en&limit=1&select[title]=true&select[slug]=true&select[meta]=true&select[layout]=true&select[author]=true&select[authorProfile]=true&select[createdAt]=true&select[updatedAt]=true",
                    "rt": "json"
                },
                "4be436f481abf3a7dbd3ce2598e4fd6c2295d7d0534446633c2e66596ddab333": {
                    "b": {
                        "data": {
                            "results": [
                                {
                                    "_source": {
                                        "amount_target": 0,
                                        "appeal": "",
                                        "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/1d5df8bd1e994012/public",
                                        "base_lang_code": "en",
                                        "category": "10",
                                        "connected_fundraiser_donation": 0,
                                        "content": "August 2026Maariti 40. sünnipäev- aitame tal taastumisega jätkata 💙 (ENG below)Poolteist aastat tagasi muutus Maariti ja tema pere elu. 2024. aasta detsembris, neljandal raseduskuul, tabas Maaritit raskekujuline tüsistustega meningiit. Ta veetis seitse kuud haiglas ning alustas seejärel pikka ja nõudlikku taastumise teekonda.Tänu eelmisel aastal Maariti ja Martini sünnipäevadeks annetatud rahale sai Maarit terve aasta jooksul kuus korda nädalas füsioteraapiat. See abi on toonud päriselt suuri muutusi: Maarit suudab nüüd lühiajaliselt iseseisvalt istuda, kõrvalabiga seista ning teha kõnniraami toel samme. Tema lihasjõud ja liikuvus on paranenud ning tema aktiivsus ja iseseisvus igapäevatoimingutes on järk-järgult suurenenud. Lisaks käis tal regulaarselt kodus logopeed, et aidata taastada kõnefunktsiooni. Mis on lähedaste jaoks eriti rõõmustav on see, et Maaritiga saab juba kevadest Whatsapi kaudu kirjutada, ta suhtleb küllaltki aktiivselt, teeb nalja ja reageerib agaralt fotodele ja videotele.See kõik on arvestades juhtunut tohutu edasiminek. Kuid Maariti taastumine võtab veel aega.Tema keha väsib kiiresti, keha kontroll vajab endiselt palju tööd ning kõne- ja neelamisfunktsioon on raskelt kahjustatud. Selleks, et senised edusammud säiliksid, vajab ta jätkuvalt intensiivset füsioteraapiat, tegevusteraapiat ja logopeedilist abi.Maarit ja Martin on teinud uskumatult palju väga rasket tööd. Nende sihikindlus, huumor ja motivatsioon on alles – ning Maariti edusammud näitavad, et tema taastumispotentsiaal samuti. Iga annetus, olenemata suurusest, aitab anda talle võimaluse edasi liikuda: iseseisvamalt istuda, seista, liikuda, neelata, suhelda ja olla rohkem kohal oma kolme lapse elus.Eelmisel aastal kogutud raha on nüüdseks peaaegu kasutatud. Seetõttu palume taas sõprade, tuttavate ja heade inimeste abi!Meil ei ole kunagi olnud kahtlust, et Maarit taastub sellest paugust. Küsimus pole mitte kas, vaid millal. Maaritil on vaja alustatud tööd jätkata, paneme ka õla alla! 💙Maarit’s 40th Birthday – Let’s Help Her Continue Her Recovery 💙A year and a half ago, Maarit’s life—and the life of her entire family—changed. In December 2024, during the fourth month of her pregnancy, Maarit was struck by a severe and complicated case of meningitis. She spent seven months in hospital and then began a long and demanding journey towards recovery.Thanks to the money donated for Maarit and Martin’s birthdays last year, Maarit was able to receive physiotherapy five times a week for an entire year. This support has brought about real and significant progress: Maarit can now sit independently for short periods, stand with assistance and take steps using a walking frame. Her muscle strength and mobility have improved, and she is participating increasingly actively in everyday activities.A speech therapist has also visited her regularly at home to help restore her ability to speak. What has brought particular joy to her loved ones is that, since spring, they have been able to communicate with Maarit via WhatsApp. She is quite active in conversations, makes jokes and enthusiastically responds to photos and videos.Considering everything she has been through, this represents enormous progress. But Maarit’s recovery will still take time.Her body tires quickly, she still needs to do a great deal of work on body control, and her speech and swallowing functions remain severely impaired. To maintain the progress she has already made, she continues to need intensive physiotherapy, occupational therapy and speech therapy.Maarit and Martin have put in an incredible amount of very hard work. Their determination, humour and motivation remain strong—and Maarit’s progress shows that her potential for further recovery remains strong too. Every donation, regardless of its size, gives her a chance to keep moving forward: to sit, stand and move more independently, to swallow and communicate, and to be more present in the lives of her three children.The money raised last year has now been almost entirely used. That is why we are once again asking friends, acquaintances and kind-hearted people for their support.We have never doubted that Maarit will recover from this devastating ordeal. The question is not if, but when. Maarit needs the opportunity to continue the work she has already begun—let’s all lend a hand and help her keep going! 💙***August 2025(ENG below)Maarit terveks!Maaritit (38) tabas 2024. aasta detsembris, neljandal raseduskuul, raskekujuline tüsistustega meningiit, mille tulemusena ta oli seitse kuud haiglas ja mille tagajärjel ei saa ta täna veel suu kaudu süüa ega rääkida. Liigutamine on vaevaline. Õnneks ta saab kõigest toimuvast aru, suhtleb käemärkide ja mõningase arvutisse trükkimise abil ning on talle omase sihikindluse, tahtejõu ja huuumoriga suurte hüpetega paranemisekursil. Maariti täielik taastumine kuni selleni, et ta saaks uuesti täiel rinnal elust osa võtta ja oma perele pühenduda, võtab aega, võib-olla paar aastat.Maaritil ja Martinil on kolm väikest last (4a, 2a ja 0,4a), kelle eest täna hoolitsevad vanavanemad, sugulased ja sõbrad. Maariti abikaasa Martin on Maariti 24/7 hooldaja, tugisammas ning optimismi, huumori ja armastuse kehastus. Ilmselt ei ole vaja detailselt kirjeldada, et kogu see olukord on Maariti ja Martini perele ja lähedastele väljakutsete rohke. Seda nii füüsiliselt, emotsionaalselt kui ka puht praktiliselt. Maariti taastumine tähendab pühendumist, sihikindlat tööd ja aega, aga ka raha.Oleme Maariti ja Martini pere toetuseks loonud MTÜ Vesiniidu Fond (Vesiniidu on nende kodutalu nimi), mille ainuke eesmärk on koguda vahendeid selleks, et Maariti pere saaks keskenduda tema taastumisele ja Maarit saaks võimalikult kiiresti terveks!Lisatoetust on vaja väga mitmetel eesmärkidel:• regulaarsed rehabilitatsiooniravil viibimised• meditsiinitarvikud, ravimid• abipersonali (lapsehoidjate, hooldusõdede, logopeedi, füsioterapeudi) palkamiseks.• muudeks ettenägematuteks kulutusteks, kuni nii Maariti kui Martini sissetulek taastub.Kuigi osa taastumise kuludest katab ka riik, siis iga rahatäpp, olenemata suurusest, muudab ühe pere elu paremaks ja aitab neil keskenduda kõige olulisemale- Maariti tervenemisele.Raha kogumise ja kasutamise kohta anname regulaarselt ülevaadet selle sama kampaanialehe kaudu. Juhul, kui raha jääb üle, suuname selle teistele sarnases olukorras olevatele peredele.NB! See kampaania on mõeldud Maaritile ja Martinile sünnipäeva üllatusena, ehk kes neid tunnevad, ärge siis üllatust spoilige! ;) Eesmärk on koguda üks ilus toetussuma ja anda sellest neile teada 28. augustil ehk Maariti sünnipäeval. Martini sünnipäev on 1. Septembril.Sõbrad, let’s make it rain! 🌧️💙Lisainfo ja küsimused:Liis Narusk liisnarusk@gmail.comvõiLaura Nestor lauranestorphotography@gmail.com***Get Well, Maarit!Our dear friend Maarit (38) was struck in December 2024, during her fourth month of pregnancy, by a severe meningitis. As a result, she spent seven months in the hospital and is still unable to speak or eat solid food. Moving is difficult. Fortunately, she understands everything that is happening around her and communicates through hand signs and some typing on her computer. With her characteristic determination, willpower, and humor, she is making big strides on the path to recovery. Maarit’s full recovery — to the point where she can once again fully participate in life and dedicate herself to her family — will take time, perhaps a couple of years.Maarit and Martin have three small children (aged 4, 2, and 4 months), who are currently cared for by grandparents, relatives, and friends. Her husband Martin is her 24/7 caregiver, rock, and embodiment of optimism, humor, and unconditional love.It hardly needs to be explained that this situation has brought immense challenges to Maarit and Martin’s family and their loved ones — physically, emotionally, and practically. Recovery requires commitment, persistent work, and time, but also money.To support Maarit and Martin’s family, we have established the NGO Vesiniidu Fund (Vesiniidu is the name of their home), whose sole purpose is to raise resources so that the family can focus fully on her recovery and help Maarit get well as soon as possible!Additional support is needed for many purposes:• Regular rehabilitation stays• Medical supplies and medications• Hiring support staff (babysitters, care nurses, speech therapist, physiotherapist etc)• Other unforeseen expenses until both Maarit’s and Martin’s incomes are restored.Although some marginal part of recovery costs are covered by the state, every contribution, no matter how small, makes this family’s life better and helps them focus on the most important — Maarit’s recovery.We will provide regular updates on the collection and use of funds through this campaign page. In the event that donations exceed the family’s needs, the remaining funds will be redirected to support other families in similar situations.NB! This campaign is meant as a birthday surprise for Maarit and Martin — so if you know them, please don’t spoil it! ;) Our goal is to gather a meaningful sum of support and present it to them on August 28, Maarit’s birthday. Martin’s birthday follows on September 1.Friends, let’s make it rain! 🌧️💙Additional information:Liis Narusk liisnarusk@gmail.comvõiLaura Nestor lauranestorphotography@gmail.com",
                                        "created_at_ts": 1755621282,
                                        "currency_code": "eur",
                                        "currency_symbol": "€",
                                        "deleted": 0,
                                        "description": "August 2026 Maariti 40. sünnipäev- aitame tal taastumisega jätkata 💙 (ENG below) Poolteist aastat tagasi muutus Maariti ja tema pere elu. 2024. aasta detsembris, neljandal raseduskuul, tabas Maaritit raskekujuline tüsistustega meningiit. Ta veetis seitse kuud haiglas ning alustas seejärel pikka ja nõudlikku taastumise teekonda. Tänu eelmisel aastal Maariti ja Martini sünnipäevadeks annetatud rahale sai Maarit terve aasta jooksul kuus korda nädalas füsioteraapiat. See abi on toonud päriselt suuri muutusi: Maarit suudab nüüd lühiajaliselt iseseisvalt istuda, kõrvalabiga seista ning teha kõnniraami toel samme. Tema lihasjõud ja liikuvus on paranenud ning tema aktiivsus ja iseseisvus igapäevatoimingutes on järk-järgult suurenenud. Lisaks käis tal regulaarselt kodus logopeed, et aidata taastada kõnefunktsiooni. Mis on lähedaste jaoks eriti rõõmustav on see, et Maaritiga saab juba kevadest Whatsapi kaudu kirjutada, ta suhtleb küllaltki aktiivselt, teeb nalja ja reageerib agaralt fotodele ja videotele. See kõik on arvestades juhtunut tohutu edasiminek. Kuid Maariti taastumine võtab veel aega. Tema keha väsib kiiresti, keha kontroll vajab endiselt palju tööd ning kõne- ja neelamisfunktsioon on raskelt kahjustatud. Selleks, et senised edusammud säiliksid, vajab ta jätkuvalt intensiivset füsioteraapiat, tegevusteraapiat ja logopeedilist abi. Maarit ja Martin on teinud uskumatult palju väga rasket tööd. Nende sihikindlus, huumor ja motivatsioon on alles – ning Maariti edusammud näitavad, et tema taastumispotentsiaal samuti. Iga annetus, olenemata suurusest, aitab anda talle võimaluse edasi liikuda: iseseisvamalt istuda, seista, liikuda, neelata, suhelda ja olla rohkem kohal oma kolme lapse elus. Eelmisel aastal kogutud raha on nüüdseks peaaegu kasutatud. Seetõttu palume taas sõprade, tuttavate ja heade inimeste abi! Meil ei ole kunagi olnud kahtlust, et Maarit taastub sellest paugust. Küsimus pole mitte kas, vaid millal. Maaritil on vaja alustatud tööd jätkata, paneme ka õla alla! 💙 Maarit’s 40th Birthday – Let’s Help Her Continue Her Recovery 💙 A year and a half ago, Maarit’s life—and the life of her entire family—changed. In December 2024, during the fourth month of her pregnancy, Maarit was struck by a severe and complicated case of meningitis. She spent seven months in hospital and then began a long and demanding journey towards recovery. Thanks to the money donated for Maarit and Martin’s birthdays last year, Maarit was able to receive physiotherapy five times a week for an entire year. This support has brought about real and significant progress: Maarit can now sit independently for short periods, stand with assistance and take steps using a walking frame. Her muscle strength and mobility have improved, and she is participating increasingly actively in everyday activities. A speech therapist has also visited her regularly at home to help restore her ability to speak. What has brought particular joy to her loved ones is that, since spring, they have been able to communicate with Maarit via WhatsApp. She is quite active in conversations, makes jokes and enthusiastically responds to photos and videos. Considering everything she has been through, this represents enormous progress. But Maarit’s recovery will still take time. Her body tires quickly, she still needs to do a great deal of work on body control, and her speech and swallowing functions remain severely impaired. To maintain the progress she has already made, she continues to need intensive physiotherapy, occupational therapy and speech therapy. Maarit and Martin have put in an incredible amount of very hard work. Their determination, humour and motivation remain strong—and Maarit’s progress shows that her potential for further recovery remains strong too. Every donation, regardless of its size, gives her a chance to keep moving forward: to sit, stand and move more independently, to swallow and communicate, and to be more present in the lives of her three children. The money raised last year has now been almost entirely used. That is why we are once again asking friends, acquaintances and kind-hearted people for their support. We have never doubted that Maarit will recover from this devastating ordeal. The question is not if, but when. Maarit needs the opportunity to continue the work she has already begun—let’s all lend a hand and help her keep going! 💙 *** August 2025 (ENG below) Maarit terveks! Maaritit (38) tabas 2024. aasta detsembris, neljandal raseduskuul, raskekujuline tüsistustega meningiit, mille tulemusena ta oli seitse kuud haiglas ja mille tagajärjel ei saa ta täna veel suu kaudu süüa ega rääkida. Liigutamine on vaevaline. Õnneks ta saab kõigest toimuvast aru, suhtleb käemärkide ja mõningase arvutisse trükkimise abil ning on talle omase sihikindluse, tahtejõu ja huuumoriga suurte hüpetega paranemisekursil. Maariti täielik taastumine kuni selleni, et ta saaks uuesti täiel rinnal elust osa võtta ja oma perele pühenduda, võtab aega, võib-olla paar aastat. Maaritil ja Martinil on kolm väikest last (4a, 2a ja 0,4a), kelle eest täna hoolitsevad vanavanemad, sugulased ja sõbrad. Maariti abikaasa Martin on Maariti 24/7 hooldaja, tugisammas ning optimismi, huumori ja armastuse kehastus. Ilmselt ei ole vaja detailselt kirjeldada, et kogu see olukord on Maariti ja Martini perele ja lähedastele väljakutsete rohke. Seda nii füüsiliselt, emotsionaalselt kui ka puht praktiliselt. Maariti taastumine tähendab pühendumist, sihikindlat tööd ja aega, aga ka raha. Oleme Maariti ja Martini pere toetuseks loonud MTÜ Vesiniidu Fond (Vesiniidu on nende kodutalu nimi), mille ainuke eesmärk on koguda vahendeid selleks, et Maariti pere saaks keskenduda tema taastumisele ja Maarit saaks võimalikult kiiresti terveks! Lisatoetust on vaja väga mitmetel eesmärkidel: • regulaarsed rehabilitatsiooniravil viibimised • meditsiinitarvikud, ravimid • abipersonali (lapsehoidjate, hooldusõdede, logopeedi, füsioterapeudi) palkamiseks. • muudeks ettenägematuteks kulutusteks, kuni nii Maariti kui Martini sissetulek taastub. Kuigi osa taastumise kuludest katab ka riik, siis iga rahatäpp, olenemata suurusest, muudab ühe pere elu paremaks ja aitab neil keskenduda kõige olulisemale- Maariti tervenemisele. Raha kogumise ja kasutamise kohta anname regulaarselt ülevaadet selle sama kampaanialehe kaudu. Juhul, kui raha jääb üle, suuname selle teistele sarnases olukorras olevatele peredele. NB! See kampaania on mõeldud Maaritile ja Martinile sünnipäeva üllatusena, ehk kes neid tunnevad, ärge siis üllatust spoilige! ;) Eesmärk on koguda üks ilus toetussuma ja anda sellest neile teada 28. augustil ehk Maariti sünnipäeval. Martini sünnipäev on 1. Septembril. Sõbrad, let’s make it rain! 🌧️💙 Lisainfo ja küsimused: Liis Narusk liisnarusk@gmail.com või Laura Nestor lauranestorphotography@gmail.com *** Get Well, Maarit! Our dear friend Maarit (38) was struck in December 2024, during her fourth month of pregnancy, by a severe meningitis. As a result, she spent seven months in the hospital and is still unable to speak or eat solid food. Moving is difficult. Fortunately, she understands everything that is happening around her and communicates through hand signs and some typing on her computer. With her characteristic determination, willpower, and humor, she is making big strides on the path to recovery. Maarit’s full recovery — to the point where she can once again fully participate in life and dedicate herself to her family — will take time, perhaps a couple of years. Maarit and Martin have three small children (aged 4, 2, and 4 months), who are currently cared for by grandparents, relatives, and friends. Her husband Martin is her 24/7 caregiver, rock, and embodiment of optimism, humor, and unconditional love. It hardly needs to be explained that this situation has brought immense challenges to Maarit and Martin’s family and their loved ones — physically, emotionally, and practically. Recovery requires commitment, persistent work, and time, but also money. To support Maarit and Martin’s family, we have established the NGO Vesiniidu Fund (Vesiniidu is the name of their home), whose sole purpose is to raise resources so that the family can focus fully on her recovery and help Maarit get well as soon as possible! Additional support is needed for many purposes: • Regular rehabilitation stays • Medical supplies and medications • Hiring support staff (babysitters, care nurses, speech therapist, physiotherapist etc) • Other unforeseen expenses until both Maarit’s and Martin’s incomes are restored. Although some marginal part of recovery costs are covered by the state, every contribution, no matter how small, makes this family’s life better and helps them focus on the most important — Maarit’s recovery. We will provide regular updates on the collection and use of funds through this campaign page. In the event that donations exceed the family’s needs, the remaining funds will be redirected to support other families in similar situations. NB! This campaign is meant as a birthday surprise for Maarit and Martin — so if you know them, please don’t spoil it! ;) Our goal is to gather a meaningful sum of support and present it to them on August 28, Maarit’s birthday. Martin’s birthday follows on September 1. Friends, let’s make it rain! 🌧️💙 Additional information: Liis Narusk liisnarusk@gmail.com või Laura Nestor lauranestorphotography@gmail.com",
                                        "donation": 71525,
                                        "donation_count": 1164,
                                        "end_date": "9999-12-31",
                                        "end_date_ts": 253402214400,
                                        "fundraiser_id": 92798,
                                        "id": "92798",
                                        "is_draft": 0,
                                        "is_findable": 1,
                                        "is_opened": 1,
                                        "live": 1,
                                        "offline_donation": 0,
                                        "profile": {
                                            "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/profile_image/5285ab5510444703/public",
                                            "name": "Liis Narusk"
                                        },
                                        "show_donation_details": 1,
                                        "show_received_donations": 1,
                                        "slug": "vesiniidu",
                                        "title": "Maarit terveks/Get well Maarit!",
                                        "total_donation_eur": 71524.14,
                                        "translation": {
                                            "title_en": "Maarit terveks/Get well Maarit!",
                                            "description_en": "August 2026 Maariti 40. sünnipäev- aitame tal taastumisega jätkata 💙 (ENG below) Poolteist aastat tagasi muutus Maariti ja tema pere elu. 2024. aasta detsembris, neljandal raseduskuul, tabas Maaritit raskekujuline tüsistustega meningiit. Ta veetis seitse kuud haiglas ning alustas seejärel pikka ja nõudlikku taastumise teekonda. Tänu eelmisel aastal Maariti ja Martini sünnipäevadeks annetatud rahale sai Maarit terve aasta jooksul kuus korda nädalas füsioteraapiat. See abi on toonud päriselt suuri muutusi: Maarit suudab nüüd lühiajaliselt iseseisvalt istuda, kõrvalabiga seista ning teha kõnniraami toel samme. Tema lihasjõud ja liikuvus on paranenud ning tema aktiivsus ja iseseisvus igapäevatoimingutes on järk-järgult suurenenud. Lisaks käis tal regulaarselt kodus logopeed, et aidata taastada kõnefunktsiooni. Mis on lähedaste jaoks eriti rõõmustav on see, et Maaritiga saab juba kevadest Whatsapi kaudu kirjutada, ta suhtleb küllaltki aktiivselt, teeb nalja ja reageerib agaralt fotodele ja videotele. See kõik on arvestades juhtunut tohutu edasiminek. Kuid Maariti taastumine võtab veel aega. Tema keha väsib kiiresti, keha kontroll vajab endiselt palju tööd ning kõne- ja neelamisfunktsioon on raskelt kahjustatud. Selleks, et senised edusammud säiliksid, vajab ta jätkuvalt intensiivset füsioteraapiat, tegevusteraapiat ja logopeedilist abi. Maarit ja Martin on teinud uskumatult palju väga rasket tööd. Nende sihikindlus, huumor ja motivatsioon on alles – ning Maariti edusammud näitavad, et tema taastumispotentsiaal samuti. Iga annetus, olenemata suurusest, aitab anda talle võimaluse edasi liikuda: iseseisvamalt istuda, seista, liikuda, neelata, suhelda ja olla rohkem kohal oma kolme lapse elus. Eelmisel aastal kogutud raha on nüüdseks peaaegu kasutatud. Seetõttu palume taas sõprade, tuttavate ja heade inimeste abi! Meil ei ole kunagi olnud kahtlust, et Maarit taastub sellest paugust. Küsimus pole mitte kas, vaid millal. Maaritil on vaja alustatud tööd jätkata, paneme ka õla alla! 💙 Maarit’s 40th Birthday – Let’s Help Her Continue Her Recovery 💙 A year and a half ago, Maarit’s life—and the life of her entire family—changed. In December 2024, during the fourth month of her pregnancy, Maarit was struck by a severe and complicated case of meningitis. She spent seven months in hospital and then began a long and demanding journey towards recovery. Thanks to the money donated for Maarit and Martin’s birthdays last year, Maarit was able to receive physiotherapy five times a week for an entire year. This support has brought about real and significant progress: Maarit can now sit independently for short periods, stand with assistance and take steps using a walking frame. Her muscle strength and mobility have improved, and she is participating increasingly actively in everyday activities. A speech therapist has also visited her regularly at home to help restore her ability to speak. What has brought particular joy to her loved ones is that, since spring, they have been able to communicate with Maarit via WhatsApp. She is quite active in conversations, makes jokes and enthusiastically responds to photos and videos. Considering everything she has been through, this represents enormous progress. But Maarit’s recovery will still take time. Her body tires quickly, she still needs to do a great deal of work on body control, and her speech and swallowing functions remain severely impaired. To maintain the progress she has already made, she continues to need intensive physiotherapy, occupational therapy and speech therapy. Maarit and Martin have put in an incredible amount of very hard work. Their determination, humour and motivation remain strong—and Maarit’s progress shows that her potential for further recovery remains strong too. Every donation, regardless of its size, gives her a chance to keep moving forward: to sit, stand and move more independently, to swallow and communicate, and to be more present in the lives of her three children. The money raised last year has now been almost entirely used. That is why we are once again asking friends, acquaintances and kind-hearted people for their support. We have never doubted that Maarit will recover from this devastating ordeal. The question is not if, but when. Maarit needs the opportunity to continue the work she has already begun—let’s all lend a hand and help her keep going! 💙 *** August 2025 (ENG below) Maarit terveks! Maaritit (38) tabas 2024. aasta detsembris, neljandal raseduskuul, raskekujuline tüsistustega meningiit, mille tulemusena ta oli seitse kuud haiglas ja mille tagajärjel ei saa ta täna veel suu kaudu süüa ega rääkida. Liigutamine on vaevaline. Õnneks ta saab kõigest toimuvast aru, suhtleb käemärkide ja mõningase arvutisse trükkimise abil ning on talle omase sihikindluse, tahtejõu ja huuumoriga suurte hüpetega paranemisekursil. Maariti täielik taastumine kuni selleni, et ta saaks uuesti täiel rinnal elust osa võtta ja oma perele pühenduda, võtab aega, võib-olla paar aastat. Maaritil ja Martinil on kolm väikest last (4a, 2a ja 0,4a), kelle eest täna hoolitsevad vanavanemad, sugulased ja sõbrad. Maariti abikaasa Martin on Maariti 24/7 hooldaja, tugisammas ning optimismi, huumori ja armastuse kehastus. Ilmselt ei ole vaja detailselt kirjeldada, et kogu see olukord on Maariti ja Martini perele ja lähedastele väljakutsete rohke. Seda nii füüsiliselt, emotsionaalselt kui ka puht praktiliselt. Maariti taastumine tähendab pühendumist, sihikindlat tööd ja aega, aga ka raha. Oleme Maariti ja Martini pere toetuseks loonud MTÜ Vesiniidu Fond (Vesiniidu on nende kodutalu nimi), mille ainuke eesmärk on koguda vahendeid selleks, et Maariti pere saaks keskenduda tema taastumisele ja Maarit saaks võimalikult kiiresti terveks! Lisatoetust on vaja väga mitmetel eesmärkidel: • regulaarsed rehabilitatsiooniravil viibimised • meditsiinitarvikud, ravimid • abipersonali (lapsehoidjate, hooldusõdede, logopeedi, füsioterapeudi) palkamiseks. • muudeks ettenägematuteks kulutusteks, kuni nii Maariti kui Martini sissetulek taastub. Kuigi osa taastumise kuludest katab ka riik, siis iga rahatäpp, olenemata suurusest, muudab ühe pere elu paremaks ja aitab neil keskenduda kõige olulisemale- Maariti tervenemisele. Raha kogumise ja kasutamise kohta anname regulaarselt ülevaadet selle sama kampaanialehe kaudu. Juhul, kui raha jääb üle, suuname selle teistele sarnases olukorras olevatele peredele. NB! See kampaania on mõeldud Maaritile ja Martinile sünnipäeva üllatusena, ehk kes neid tunnevad, ärge siis üllatust spoilige! ;) Eesmärk on koguda üks ilus toetussuma ja anda sellest neile teada 28. augustil ehk Maariti sünnipäeval. Martini sünnipäev on 1. Septembril. Sõbrad, let’s make it rain! 🌧️💙 Lisainfo ja küsimused: Liis Narusk liisnarusk@gmail.com või Laura Nestor lauranestorphotography@gmail.com *** Get Well, Maarit! Our dear friend Maarit (38) was struck in December 2024, during her fourth month of pregnancy, by a severe meningitis. As a result, she spent seven months in the hospital and is still unable to speak or eat solid food. Moving is difficult. Fortunately, she understands everything that is happening around her and communicates through hand signs and some typing on her computer. With her characteristic determination, willpower, and humor, she is making big strides on the path to recovery. Maarit’s full recovery — to the point where she can once again fully participate in life and dedicate herself to her family — will take time, perhaps a couple of years. Maarit and Martin have three small children (aged 4, 2, and 4 months), who are currently cared for by grandparents, relatives, and friends. Her husband Martin is her 24/7 caregiver, rock, and embodiment of optimism, humor, and unconditional love. It hardly needs to be explained that this situation has brought immense challenges to Maarit and Martin’s family and their loved ones — physically, emotionally, and practically. Recovery requires commitment, persistent work, and time, but also money. To support Maarit and Martin’s family, we have established the NGO Vesiniidu Fund (Vesiniidu is the name of their home), whose sole purpose is to raise resources so that the family can focus fully on her recovery and help Maarit get well as soon as possible! Additional support is needed for many purposes: • Regular rehabilitation stays • Medical supplies and medications • Hiring support staff (babysitters, care nurses, speech therapist, physiotherapist etc) • Other unforeseen expenses until both Maarit’s and Martin’s incomes are restored. Although some marginal part of recovery costs are covered by the state, every contribution, no matter how small, makes this family’s life better and helps them focus on the most important — Maarit’s recovery. We will provide regular updates on the collection and use of funds through this campaign page. In the event that donations exceed the family’s needs, the remaining funds will be redirected to support other families in similar situations. NB! This campaign is meant as a birthday surprise for Maarit and Martin — so if you know them, please don’t spoil it! ;) Our goal is to gather a meaningful sum of support and present it to them on August 28, Maarit’s birthday. Martin’s birthday follows on September 1. Friends, let’s make it rain! 🌧️💙 Additional information: Liis Narusk liisnarusk@gmail.com või Laura Nestor lauranestorphotography@gmail.com"
                                        },
                                        "type": "personal",
                                        "updated_at": "2026-08-26T13:04:29.991Z",
                                        "updated_at_ts": 1787749469,
                                        "video": "",
                                        "donations_last_7d": 150,
                                        "donations_last_14d": 150,
                                        "donations_last_30d": 151,
                                        "recommendation_rank_score": 0.669554,
                                        "trending_window_days": 7,
                                        "trending_score": 150
                                    }
                                },
                                {
                                    "_source": {
                                        "amount_target": 250000,
                                        "appeal": "",
                                        "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/7abdccf569bf487c/public",
                                        "base_lang_code": "en",
                                        "category": "10",
                                        "connected_fundraiser_donation": 0,
                                        "content": "Hi, my name is Stathis, I'm 32 years old, and I'm asking for your help!For over two years now, I've been living with Functional Neurological Disorder (FND), a severe neurological condition that has taken away my health, my independence, my ability to work, and the life I once had.After exhausting the treatment options available to me, I was assessed by a multidisciplinary team of specialists from the Brain & Mind Centre and Maudsley Hospital in London. My diagnosis was confirmed, and a personalized treatment plan is currently being finalized.For the first time in over two years, I have a specialist multidisciplinary team that understands my condition and is now finalising the treatment plan that offers me the best chance of recovery. The main obstacle is that this specialist treatment must be paid for in advance, and the cost is far beyond what my family and I can afford. That is why I am asking for your support.My StoryUntil 2024, I was living an independent, healthy life and building my career in Airline Revenue Management. Then everything changed. Out of nowhere, I developed progressively worsening neurological symptoms that no one could explain. Despite numerous medical consultations, investigations, and treatments, I was repeatedly left without answers. No one could tell me what was happening, why it was happening, or how to stop it. Since July 2025, I have been unable to work. Every day is spent trying to cope with my condition, coordinate my medical care, and do everything possible to access the specialist treatment that offers me the best chance of recovery.Why This Treatment?Specialist multidisciplinary treatment for Functional Neurological Disorder (FND) is still a relatively new and rapidly evolving field. Although awareness and clinical understanding have advanced significantly over the past decade, specialist expertise and dedicated multidisciplinary treatment programmes remain limited, with only a small number of centres internationally offering this level of comprehensive FND care. The Brain & Mind Centre in London and its network of specialist consultants working across leading London hospitals, including The Wellington, Maudsley and King's College, represent the closest highly specialised multidisciplinary FND service to my home country, Greece. Based on the team's assessment, my treatment is expected to require prolonged specialist multidisciplinary care because of the complexity, duration, and progression of my condition.Why I Need Your HelpWhile my treatment plan is being finalised by Dr. Okai, Professor Edwards and Dr. Gee, I must prepare for the possibility of an extended inpatient 12-week treatment programme, currently estimated at approximately £239,000 (excluding medications and any additional diagnostic investigations), which is expected to be paid in full before treatment can begin. My fundraising goal is set at £250,000 to account for payment processing fees, ensuring that the net amount raised fully covers the treatment costs. This figure represents the current upper estimate for the specialist treatment programme itself. Should my final treatment plan differ in duration or combine inpatient, outpatient or hybrid care, I will update this page accordingly, together with any significant updates to my treatment plan and supporting medical documentation. Your support will help ensure that I can begin treatment without delay once the treatment plan is confirmed.Our Financial CommitmentMy family and I remain fully committed to every aspect of my treatment. We have already covered the costs of medical consultations, investigations, medications and ongoing care, and we will continue to fund the many expenses that will arise before, during and after my core treatment in London. This includes medications, additional medical investigations if required, ongoing follow-up care, remote clinical supervision, and the continued support of my treating medical team in Greece. The only cost that is beyond our financial means is the specialist treatment in London itself. This campaign exists solely to help bridge that gap and make this treatment possible.Treatment Timeline / What Happens NextOnce funding is secured treatment can begin. Then, I will continue to share meaningful updates on my progress and any important developments throughout my recovery.Supporting Medical DocumentationRelevant medical reports, specialist assessments and supporting documentation are provided below for anyone wishing to review my case in greater detail.Questions or Additional InformationIf you would like any further information about my case, supporting medical documentation, or my treatment plan, please feel free to contact me. I would be happy to answer any questions and provide additional documentation where appropriate.Email: stathis.vrvs@gmail.comLinkedin: Efstathios (Stathis) VarverisFacebook: Stathis VarverisInstagram: stathis_vrsThank you for taking the time to read my story and consider supporting my treatment. Whether through a donation, sharing this campaign, or simply helping raise awareness, your support truly means more than words can express! Your kindness gives me hope and the opportunity to access the specialist care that could change the course of my life. I am deeply grateful for every contribution, no matter its size, and for everyone who stands beside me on this journey!",
                                        "created_at_ts": 1784818040,
                                        "currency_code": "gbp",
                                        "currency_symbol": "£",
                                        "deleted": 0,
                                        "description": "Hi, my name is Stathis, I'm 32 years old, and I'm asking for your help! For over two years now, I've been living with Functional Neurological Disorder (FND), a severe neurological condition that has taken away my health, my independence, my ability to work, and the life I once had. After exhausting the treatment options available to me, I was assessed by a multidisciplinary team of specialists from the Brain & Mind Centre and Maudsley Hospital in London. My diagnosis was confirmed, and a personalized treatment plan is currently being finalized. For the first time in over two years, I have a specialist multidisciplinary team that understands my condition and is now finalising the treatment plan that offers me the best chance of recovery. The main obstacle is that this specialist treatment must be paid for in advance, and the cost is far beyond what my family and I can afford. That is why I am asking for your support. My Story Until 2024, I was living an independent, healthy life and building my career in Airline Revenue Management. Then everything changed. Out of nowhere, I developed progressively worsening neurological symptoms that no one could explain. Despite numerous medical consultations, investigations, and treatments, I was repeatedly left without answers. No one could tell me what was happening, why it was happening, or how to stop it. Since July 2025, I have been unable to work. Every day is spent trying to cope with my condition, coordinate my medical care, and do everything possible to access the specialist treatment that offers me the best chance of recovery. Why This Treatment? Specialist multidisciplinary treatment for Functional Neurological Disorder (FND) is still a relatively new and rapidly evolving field. Although awareness and clinical understanding have advanced significantly over the past decade, specialist expertise and dedicated multidisciplinary treatment programmes remain limited, with only a small number of centres internationally offering this level of comprehensive FND care. The Brain & Mind Centre in London and its network of specialist consultants working across leading London hospitals, including The Wellington, Maudsley and King's College , represent the closest highly specialised multidisciplinary FND service to my home country, Greece. Based on the team's assessment, my treatment is expected to require prolonged specialist multidisciplinary care because of the complexity, duration, and progression of my condition. Why I Need Your Help While my treatment plan is being finalised by Dr. Okai , Professor Edwards and Dr. Gee , I must prepare for the possibility of an extended inpatient 12-week treatment programme, currently estimated at approximately £239,000 (excluding medications and any additional diagnostic investigations) , which is expected to be paid in full before treatment can begin . My fundraising goal is set at £250,000 to account for payment processing fees , ensuring that the net amount raised fully covers the treatment costs. This figure represents the current upper estimate for the specialist treatment programme itself. Should my final treatment plan differ in duration or combine inpatient, outpatient or hybrid care, I will update this page accordingly, together with any significant updates to my treatment plan and supporting medical documentation. Your support will help ensure that I can begin treatment without delay once the treatment plan is confirmed. Our Financial Commitment My family and I remain fully committed to every aspect of my treatment. We have already covered the costs of medical consultations, investigations, medications and ongoing care, and we will continue to fund the many expenses that will arise before, during and after my core treatment in London. This includes medications, additional medical investigations if required, ongoing follow-up care, remote clinical supervision, and the continued support of my treating medical team in Greece. The only cost that is beyond our financial means is the specialist treatment in London itself. This campaign exists solely to help bridge that gap and make this treatment possible . Treatment Timeline / What Happens Next Once funding is secured treatment can begin. Then, I will continue to share meaningful updates on my progress and any important developments throughout my recovery. Supporting Medical Documentation Relevant medical reports, specialist assessments and supporting documentation are provided below for anyone wishing to review my case in greater detail. Questions or Additional Information If you would like any further information about my case, supporting medical documentation, or my treatment plan, please feel free to contact me. I would be happy to answer any questions and provide additional documentation where appropriate. Email: stathis.vrvs@gmail.com Linkedin: Efstathios (Stathis) Varveris Facebook: Stathis Varveris Instagram: stathis_vrs Thank you for taking the time to read my story and consider supporting my treatment. Whether through a donation, sharing this campaign, or simply helping raise awareness, your support truly means more than words can express! Your kindness gives me hope and the opportunity to access the specialist care that could change the course of my life. I am deeply grateful for every contribution, no matter its size, and for everyone who stands beside me on this journey!",
                                        "donation": 51343,
                                        "donation_count": 1746,
                                        "end_date": "9999-12-31",
                                        "end_date_ts": 253402214400,
                                        "fundraiser_id": 131950,
                                        "id": "131950",
                                        "is_draft": 0,
                                        "is_findable": 1,
                                        "is_opened": 1,
                                        "live": 1,
                                        "offline_donation": 1676,
                                        "profile": {
                                            "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/profile_image/de13117f85a343d6/public",
                                            "name": "Efstathios Varveris"
                                        },
                                        "show_donation_details": 1,
                                        "show_received_donations": 1,
                                        "slug": "help-stathis-recover-from-fnd",
                                        "title": "Help Stathis Recover from FND",
                                        "total_donation_eur": 57961.32,
                                        "translation": {
                                            "title_en": "Help Stathis Recover from FND",
                                            "description_en": "Hi, my name is Stathis, I'm 32 years old, and I'm asking for your help! For over two years now, I've been living with Functional Neurological Disorder (FND), a severe neurological condition that has taken away my health, my independence, my ability to work, and the life I once had. After exhausting the treatment options available to me, I was assessed by a multidisciplinary team of specialists from the Brain & Mind Centre and Maudsley Hospital in London. My diagnosis was confirmed, and a personalized treatment plan is currently being finalized. For the first time in over two years, I have a specialist multidisciplinary team that understands my condition and is now finalising the treatment plan that offers me the best chance of recovery. The main obstacle is that this specialist treatment must be paid for in advance, and the cost is far beyond what my family and I can afford. That is why I am asking for your support. My Story Until 2024, I was living an independent, healthy life and building my career in Airline Revenue Management. Then everything changed. Out of nowhere, I developed progressively worsening neurological symptoms that no one could explain. Despite numerous medical consultations, investigations, and treatments, I was repeatedly left without answers. No one could tell me what was happening, why it was happening, or how to stop it. Since July 2025, I have been unable to work. Every day is spent trying to cope with my condition, coordinate my medical care, and do everything possible to access the specialist treatment that offers me the best chance of recovery. Why This Treatment? Specialist multidisciplinary treatment for Functional Neurological Disorder (FND) is still a relatively new and rapidly evolving field. Although awareness and clinical understanding have advanced significantly over the past decade, specialist expertise and dedicated multidisciplinary treatment programmes remain limited, with only a small number of centres internationally offering this level of comprehensive FND care. The Brain & Mind Centre in London and its network of specialist consultants working across leading London hospitals, including The Wellington, Maudsley and King's College , represent the closest highly specialised multidisciplinary FND service to my home country, Greece. Based on the team's assessment, my treatment is expected to require prolonged specialist multidisciplinary care because of the complexity, duration, and progression of my condition. Why I Need Your Help While my treatment plan is being finalised by Dr. Okai , Professor Edwards and Dr. Gee , I must prepare for the possibility of an extended inpatient 12-week treatment programme, currently estimated at approximately £239,000 (excluding medications and any additional diagnostic investigations) , which is expected to be paid in full before treatment can begin . My fundraising goal is set at £250,000 to account for payment processing fees , ensuring that the net amount raised fully covers the treatment costs. This figure represents the current upper estimate for the specialist treatment programme itself. Should my final treatment plan differ in duration or combine inpatient, outpatient or hybrid care, I will update this page accordingly, together with any significant updates to my treatment plan and supporting medical documentation. Your support will help ensure that I can begin treatment without delay once the treatment plan is confirmed. Our Financial Commitment My family and I remain fully committed to every aspect of my treatment. We have already covered the costs of medical consultations, investigations, medications and ongoing care, and we will continue to fund the many expenses that will arise before, during and after my core treatment in London. This includes medications, additional medical investigations if required, ongoing follow-up care, remote clinical supervision, and the continued support of my treating medical team in Greece. The only cost that is beyond our financial means is the specialist treatment in London itself. This campaign exists solely to help bridge that gap and make this treatment possible . Treatment Timeline / What Happens Next Once funding is secured treatment can begin. Then, I will continue to share meaningful updates on my progress and any important developments throughout my recovery. Supporting Medical Documentation Relevant medical reports, specialist assessments and supporting documentation are provided below for anyone wishing to review my case in greater detail. Questions or Additional Information If you would like any further information about my case, supporting medical documentation, or my treatment plan, please feel free to contact me. I would be happy to answer any questions and provide additional documentation where appropriate. Email: stathis.vrvs@gmail.com Linkedin: Efstathios (Stathis) Varveris Facebook: Stathis Varveris Instagram: stathis_vrs Thank you for taking the time to read my story and consider supporting my treatment. Whether through a donation, sharing this campaign, or simply helping raise awareness, your support truly means more than words can express! Your kindness gives me hope and the opportunity to access the specialist care that could change the course of my life. I am deeply grateful for every contribution, no matter its size, and for everyone who stands beside me on this journey!"
                                        },
                                        "type": "personal",
                                        "updated_at": "2026-08-26T13:04:52.603Z",
                                        "updated_at_ts": 1787749492,
                                        "video": "https://www.youtube.com/shorts/gv8AU1x45PY",
                                        "donations_last_7d": 730,
                                        "donations_last_14d": 1071,
                                        "donations_last_30d": 1561,
                                        "recommendation_rank_score": 0.625971,
                                        "trending_window_days": 7,
                                        "trending_score": 730
                                    }
                                },
                                {
                                    "_source": {
                                        "amount_target": 85000,
                                        "appeal": "",
                                        "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/79cd2daf983b44a7/public",
                                        "base_lang_code": "en",
                                        "category": "10",
                                        "connected_fundraiser_donation": 0,
                                        "content": "❤️ Help Antoine Continue His Journey Back to Himself Antoine has already fought so hard to come this far. Now he needs our help to take the next step. In March, Antoine suffered a devastating heart attack that caused brain damage and changed his life in an instant. But Antoine has never given up. Over the past few months, he has made remarkable progress. Step by step, he has fought his way back, and his improvement has been truly incredible. There is still so much hope for him — but he needs the right support to keep going. Unfortunately, the hospital services currently available to Antoine in Malta are no longer able to provide the ongoing cognitive rehabilitation and specialised support he needs. There is a gap in the healthcare system when it comes to the kind of long-term cognitive care Antoine requires. We don't want that gap to become the reason his recovery stops. That is why we are asking for your help. For Antoine to continue progressing, he needs to leave hospital and move into a safe, supportive environment where he can receive the care and rehabilitation he needs every single day. We are raising funds to provide him with: ❤️ Live-in carers to support him around the clock 🧠 Specialised cognitive rehabilitation and therapy 💪 Ongoing physical and neurological rehabilitation 🏠 A safe and suitable home environment 👨‍⚕️ Private medical and therapeutic support ❤️ Everything else he needs to continue his recovery Our goal is to raise enough to provide this care and support for one full year. One year could make an enormous difference in Antoine's life. It could give him the time, care and opportunity to develop his cognitive abilities, regain more independence, and continue reaching milestones that once seemed impossible. Antoine has already shown us what he is capable of. We just don't want his journey to end because the support available to him has run out. We are asking you to help us give Antoine the chance he deserves. If you can donate, every contribution — large or small — will make a difference. If you can't donate, sharing this page with your friends, family and social networks could be just as valuable. You never know who might see this and be able to help. Please help us give Antoine another chance at recovery, another chance at independence, and another chance at getting as close as possible to the person he was before his heart attack. Help us help Antoine get back to himself. ❤️ With all our hearts, thank you for your kindness, generosity and support. On behalf of Antoine and his entire family — thank you.",
                                        "created_at_ts": 1786176162,
                                        "currency_code": "eur",
                                        "currency_symbol": "€",
                                        "deleted": 0,
                                        "description": "❤️ Help Antoine Continue His Journey Back to Himself Antoine has already fought so hard to come this far. Now he needs our help to take the next step. In March, Antoine suffered a devastating heart attack that caused brain damage and changed his life in an instant. But Antoine has never given up. Over the past few months, he has made remarkable progress. Step by step, he has fought his way back, and his improvement has been truly incredible. There is still so much hope for him — but he needs the right support to keep going. Unfortunately, the hospital services currently available to Antoine in Malta are no longer able to provide the ongoing cognitive rehabilitation and specialised support he needs. There is a gap in the healthcare system when it comes to the kind of long-term cognitive care Antoine requires. We don't want that gap to become the reason his recovery stops. That is why we are asking for your help. For Antoine to continue progressing, he needs to leave hospital and move into a safe, supportive environment where he can receive the care and rehabilitation he needs every single day. We are raising funds to provide him with: ❤️ Live-in carers to support him around the clock 🧠 Specialised cognitive rehabilitation and therapy 💪 Ongoing physical and neurological rehabilitation 🏠 A safe and suitable home environment 👨‍⚕️ Private medical and therapeutic support ❤️ Everything else he needs to continue his recovery Our goal is to raise enough to provide this care and support for one full year. One year could make an enormous difference in Antoine's life. It could give him the time, care and opportunity to develop his cognitive abilities, regain more independence, and continue reaching milestones that once seemed impossible. Antoine has already shown us what he is capable of. We just don't want his journey to end because the support available to him has run out. We are asking you to help us give Antoine the chance he deserves. If you can donate, every contribution — large or small — will make a difference. If you can't donate, sharing this page with your friends, family and social networks could be just as valuable. You never know who might see this and be able to help. Please help us give Antoine another chance at recovery, another chance at independence, and another chance at getting as close as possible to the person he was before his heart attack. Help us help Antoine get back to himself. ❤️ With all our hearts, thank you for your kindness, generosity and support. On behalf of Antoine and his entire family — thank you.",
                                        "donation": 52290,
                                        "donation_count": 501,
                                        "end_date": "9999-12-31",
                                        "end_date_ts": 253402214400,
                                        "fundraiser_id": 133681,
                                        "id": "133681",
                                        "is_draft": 0,
                                        "is_findable": 1,
                                        "is_opened": 1,
                                        "live": 1,
                                        "offline_donation": 5370,
                                        "profile": {
                                            "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/profile_image/85a53ac10c724f75/public",
                                            "name": "Lucienne  Degiorgio "
                                        },
                                        "show_donation_details": 1,
                                        "show_received_donations": 1,
                                        "slug": "help-make-antoine-great-again-",
                                        "title": "Help make Antoine great again ",
                                        "total_donation_eur": 46920.4,
                                        "translation": {
                                            "title_en": "Help make Antoine great again ",
                                            "description_en": "❤️ Help Antoine Continue His Journey Back to Himself Antoine has already fought so hard to come this far. Now he needs our help to take the next step. In March, Antoine suffered a devastating heart attack that caused brain damage and changed his life in an instant. But Antoine has never given up. Over the past few months, he has made remarkable progress. Step by step, he has fought his way back, and his improvement has been truly incredible. There is still so much hope for him — but he needs the right support to keep going. Unfortunately, the hospital services currently available to Antoine in Malta are no longer able to provide the ongoing cognitive rehabilitation and specialised support he needs. There is a gap in the healthcare system when it comes to the kind of long-term cognitive care Antoine requires. We don't want that gap to become the reason his recovery stops. That is why we are asking for your help. For Antoine to continue progressing, he needs to leave hospital and move into a safe, supportive environment where he can receive the care and rehabilitation he needs every single day. We are raising funds to provide him with: ❤️ Live-in carers to support him around the clock 🧠 Specialised cognitive rehabilitation and therapy 💪 Ongoing physical and neurological rehabilitation 🏠 A safe and suitable home environment 👨‍⚕️ Private medical and therapeutic support ❤️ Everything else he needs to continue his recovery Our goal is to raise enough to provide this care and support for one full year. One year could make an enormous difference in Antoine's life. It could give him the time, care and opportunity to develop his cognitive abilities, regain more independence, and continue reaching milestones that once seemed impossible. Antoine has already shown us what he is capable of. We just don't want his journey to end because the support available to him has run out. We are asking you to help us give Antoine the chance he deserves. If you can donate, every contribution — large or small — will make a difference. If you can't donate, sharing this page with your friends, family and social networks could be just as valuable. You never know who might see this and be able to help. Please help us give Antoine another chance at recovery, another chance at independence, and another chance at getting as close as possible to the person he was before his heart attack. Help us help Antoine get back to himself. ❤️ With all our hearts, thank you for your kindness, generosity and support. On behalf of Antoine and his entire family — thank you."
                                        },
                                        "type": "personal",
                                        "updated_at": "2026-08-26T11:03:55.011Z",
                                        "updated_at_ts": 1787742235,
                                        "video": "",
                                        "donations_last_7d": 56,
                                        "donations_last_14d": 243,
                                        "donations_last_30d": 501,
                                        "recommendation_rank_score": 0.625856,
                                        "trending_window_days": 7,
                                        "trending_score": 56
                                    }
                                },
                                {
                                    "_source": {
                                        "amount_target": 260000,
                                        "appeal": "",
                                        "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/7d2fd49168a040b6/public",
                                        "base_lang_code": "en",
                                        "category": "14",
                                        "connected_fundraiser_donation": 39074,
                                        "content": "THE CRISIS IS NOW AND ACTION IS NEEDEDScience shows that we have little time to make the changes needed to prevent irreversible damage to our climate. People and communities that contribute least to climate change are hit hardest.Yet the collective delusion persists that we can continue our current way of life indefinitely.Our economic, political and social reality rests on this illusion.We all need to face reality and stand up for life.We rebel for life, will you join us?Extinction Rebellion Netherlands organizes creative, fun and sometimes disruptive actions to draw attention to the climate crisis and to demand climate justice.We understand that not everyone has the time and space to take action.Fortunately, you can also help by rebelling with your wallet!With a monthly, annual or one-off contribution you help us to ensure that our government does what is necessary, for you, for your children and for everyone on earth.Support the uprising, become a donor",
                                        "created_at_ts": 1586850798,
                                        "currency_code": "eur",
                                        "currency_symbol": "€",
                                        "deleted": 0,
                                        "description": "THE CRISIS IS NOW AND ACTION IS NEEDED Science shows that we have little time to make the changes needed to prevent irreversible damage to our climate. People and communities that contribute least to climate change are hit hardest. Yet the collective delusion persists that we can continue our current way of life indefinitely. Our economic, political and social reality rests on this illusion. We all need to face reality and stand up for life. We rebel for life, will you join us? Extinction Rebellion Netherlands organizes creative, fun and sometimes disruptive actions to draw attention to the climate crisis and to demand climate justice. We understand that not everyone has the time and space to take action. Fortunately, you can also help by rebelling with your wallet! With a monthly, annual or one-off contribution you help us to ensure that our government does what is necessary, for you, for your children and for everyone on earth. Support the uprising, become a donor",
                                        "donation": 258976,
                                        "donation_count": 10733,
                                        "end_date": "9999-12-31",
                                        "end_date_ts": 253402214400,
                                        "fundraiser_id": 9942,
                                        "id": "9942",
                                        "is_draft": 0,
                                        "is_findable": 1,
                                        "is_opened": 1,
                                        "live": 1,
                                        "offline_donation": 0,
                                        "profile": {
                                            "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/profile_image/a167dab8480a48e2/public",
                                            "name": "Extinction Rebellion Nederland"
                                        },
                                        "show_donation_details": 1,
                                        "slug": "help-extinction-rebellion-nederland",
                                        "title": "Help Extinction Rebellion Nederland",
                                        "total_donation_eur": 259154.07,
                                        "translation": {
                                            "title_en": "",
                                            "description_en": "We need to act now. The climate and ecological crisis continues while the political will for radical action falls behind. Governments must focus on developing much more ambitious climate policies. If we don't, we will be on track for a temperature increase of 3 degrees or more by 2100, resulting in unprecedented disastrous consequences. Three cabinet-"
                                        },
                                        "type": "organization",
                                        "updated_at": "2026-08-26T04:03:03.156Z",
                                        "updated_at_ts": 1787716983,
                                        "video": "",
                                        "donations_last_7d": 14,
                                        "donations_last_14d": 30,
                                        "donations_last_30d": 80,
                                        "recommendation_rank_score": 0.602665,
                                        "trending_window_days": 7,
                                        "trending_score": 14
                                    }
                                },
                                {
                                    "_source": {
                                        "amount_target": 100000,
                                        "appeal": "",
                                        "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/e7319ae54a92412b/public",
                                        "base_lang_code": "en",
                                        "category": "10",
                                        "connected_fundraiser_donation": 0,
                                        "content": "My name is Philecia, and for the past 3½ years I've been fighting reoccurrence of Stage IV metastatic breast cancer. as of 8•25•26 my cancer has progressed even more and we are in for a bigger fight then we thought. Throughout this 8 year journey, I've continued working multiple jobs and doing everything possible to support myself. I have never asked for financial help before (a gofundme was made by my late friend in 2018 that helped with harvesting my eggs) which makes creating this fundraiser incredibly difficult. It comes with a deep sense of guilt, but also the reality that I need help. Recent progression of my cancer has led to new treatment decisions, travels to Houston to MD Anderson (where only one of my insurances is accepted) , cash only specialist that will be continues care, mounting medical expenses from nearly a decade of consistent fighting, regular life bills, and supportive care needs. Every donation, share, and prayer helps lighten a burden so I can give 110% to this. I can no longer carry alone. I need to breathe. Thank you for standing beside me and giving me the chance to keep fighting.",
                                        "created_at_ts": 1781653260,
                                        "currency_code": "usd",
                                        "currency_symbol": "$",
                                        "deleted": 0,
                                        "description": "My name is Philecia, and for the past 3½ years I've been fighting reoccurrence of Stage IV metastatic breast cancer. as of 8•25•26 my cancer has progressed even more and we are in for a bigger fight then we thought. Throughout this 8 year journey, I've continued working multiple jobs and doing everything possible to support myself. I have never asked for financial help before (a gofundme was made by my late friend in 2018 that helped with harvesting my eggs) which makes creating this fundraiser incredibly difficult. It comes with a deep sense of guilt, but also the reality that I need help. Recent progression of my cancer has led to new treatment decisions, travels to Houston to MD Anderson (where only one of my insurances is accepted) , cash only specialist that will be continues care, mounting medical expenses from nearly a decade of consistent fighting, regular life bills, and supportive care needs. Every donation, share, and prayer helps lighten a burden so I can give 110% to this. I can no longer carry alone. I need to breathe. Thank you for standing beside me and giving me the chance to keep fighting.",
                                        "donation": 183234,
                                        "donation_count": 4661,
                                        "end_date": "9999-12-31",
                                        "end_date_ts": 253402214400,
                                        "fundraiser_id": 127960,
                                        "id": "127960",
                                        "is_draft": 0,
                                        "is_findable": 1,
                                        "is_opened": 1,
                                        "live": 1,
                                        "offline_donation": 0,
                                        "profile": {
                                            "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/profile_image/0d7a6de30fb64dbe/public",
                                            "name": "Philecia La’Bounty"
                                        },
                                        "show_donation_details": 1,
                                        "show_received_donations": 1,
                                        "slug": "philecias-fight-",
                                        "title": "Philecia’s Fight ",
                                        "total_donation_eur": 159990.96,
                                        "translation": {
                                            "title_en": "Philecia’s Fight ",
                                            "description_en": "My name is Philecia, and for the past 3½ years I've been fighting reoccurrence of Stage IV metastatic breast cancer. as of 8•25•26 my cancer has progressed even more and we are in for a bigger fight then we thought. Throughout this 8 year journey, I've continued working multiple jobs and doing everything possible to support myself. I have never asked for financial help before (a gofundme was made by my late friend in 2018 that helped with harvesting my eggs) which makes creating this fundraiser incredibly difficult. It comes with a deep sense of guilt, but also the reality that I need help. Recent progression of my cancer has led to new treatment decisions, travels to Houston to MD Anderson (where only one of my insurances is accepted) , cash only specialist that will be continues care, mounting medical expenses from nearly a decade of consistent fighting, regular life bills, and supportive care needs. Every donation, share, and prayer helps lighten a burden so I can give 110% to this. I can no longer carry alone. I need to breathe. Thank you for standing beside me and giving me the chance to keep fighting."
                                        },
                                        "type": "personal",
                                        "updated_at": "2026-08-26T13:03:52.811Z",
                                        "updated_at_ts": 1787749432,
                                        "video": "",
                                        "donations_last_7d": 99,
                                        "donations_last_14d": 178,
                                        "donations_last_30d": 934,
                                        "recommendation_rank_score": 0.566848,
                                        "trending_window_days": 7,
                                        "trending_score": 99
                                    }
                                },
                                {
                                    "_source": {
                                        "amount_target": 100000,
                                        "appeal": "",
                                        "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/55269a0454ab41dc/public",
                                        "base_lang_code": "en",
                                        "category": "15",
                                        "connected_fundraiser_donation": 0,
                                        "content": "Aegean Boat Report, the only independent watchdog documenting what happens to refugees crossing the Aegean Sea is at risk of shutting down. With your support, we can keep this life-saving work alive and ensure that every person at Europe’s border is seen and protected.In 2015, Norwegian volunteer Tommy Olsen stood on the beaches of Lesvos, Greece, helping families escape war and persecution. What he witnessed would change his life forever and lead to the creation of Aegean Boat Report (ABR), a one-man effort that grew into Europe’s only independent watchdog on the Aegean Sea.Tommy saw that the biggest challenge was not just the danger of the sea, but the absence of reliable information. He returned home to Tromsø determined to change that. By 2017, he had built a network that tracked every boat, every arrival, and every pushback in real time, providing verified data to humanitarian groups and the public. Today, Aegean Boat Report’s evidence is used by journalists, lawyers, UN agencies, and human-rights defenders around the world.What We Do — Every Day, Every HourAegean Boat Report operates a 24/7 hotline that responds to distress calls from families at sea. When messages for help come in, ABR verifies their location, alerts authorities, and stays connected until rescue is confirmed. This has saved lives, again and again.The organisation also documents and verifies human-rights violations, including illegal pushbacks carried out by European border forces. Its verified data has been cited by Amnesty International, Human Rights Watch, and international media outlets. ABR receives no government funding, it depends entirely on individual supporters who believe that truth, transparency, and human dignity must be protected.Why We Need Your HelpWithout sustainable funding, Aegean Boat Report will be forced to scale down or close. That would mean:• No one left to answer distress calls from people at sea.• No independent documentation of pushbacks and disappearances.• No witnesses to what happens at Europe’s maritime border.If Aegean Boat Report disappears, the truth disappears beneath the waves, and so do the people.This Is Not Charity — It’s Human Rights WorkEvery contribution helps ABR continue documenting violations, saving lives, and holding governments accountable.€25 helps verify a distress call.€100 keeps the hotline running for a day.€500 funds field monitoring for a week.Your donation keeps the only independent eyes on the Aegean open — and ensures that every life is seen, counted, and remembered.Please, donate today to keep Aegean Boat Report alive.Learn More About Aegean Boat Report• Website: https://aegeanboatreport.com/• Facebook: https://www.facebook.com/AegeanBoatReport/• Instagram: @aegeanboatreport• X (Twitter): @ABoatReport",
                                        "created_at_ts": 1761743165,
                                        "currency_code": "eur",
                                        "currency_symbol": "€",
                                        "deleted": 0,
                                        "description": "Aegean Boat Report, the only independent watchdog documenting what happens to refugees crossing the Aegean Sea is at risk of shutting down. With your support, we can keep this life-saving work alive and ensure that every person at Europe’s border is seen and protected. In 2015, Norwegian volunteer Tommy Olsen stood on the beaches of Lesvos, Greece, helping families escape war and persecution. What he witnessed would change his life forever and lead to the creation of Aegean Boat Report (ABR) , a one-man effort that grew into Europe’s only independent watchdog on the Aegean Sea . Tommy saw that the biggest challenge was not just the danger of the sea, but the absence of reliable information. He returned home to Tromsø determined to change that. By 2017, he had built a network that tracked every boat, every arrival, and every pushback in real time, providing verified data to humanitarian groups and the public. Today, Aegean Boat Report’s evidence is used by journalists, lawyers, UN agencies, and human-rights defenders around the world. What We Do — Every Day, Every Hour Aegean Boat Report operates a 24/7 hotline that responds to distress calls from families at sea. When messages for help come in, ABR verifies their location, alerts authorities, and stays connected until rescue is confirmed. This has saved lives, again and again. The organisation also documents and verifies human-rights violations, including illegal pushbacks carried out by European border forces. Its verified data has been cited by Amnesty International , Human Rights Watch , and international media outlets. ABR receives no government funding, it depends entirely on individual supporters who believe that truth, transparency, and human dignity must be protected. Why We Need Your Help Without sustainable funding, Aegean Boat Report will be forced to scale down or close. That would mean: • No one left to answer distress calls from people at sea. • No independent documentation of pushbacks and disappearances. • No witnesses to what happens at Europe’s maritime border. If Aegean Boat Report disappears, the truth disappears beneath the waves, and so do the people. This Is Not Charity — It’s Human Rights Work Every contribution helps ABR continue documenting violations, saving lives, and holding governments accountable. €25 helps verify a distress call. €100 keeps the hotline running for a day. €500 funds field monitoring for a week. Your donation keeps the only independent eyes on the Aegean open — and ensures that every life is seen, counted, and remembered. Please, donate today to keep Aegean Boat Report alive. Learn More About Aegean Boat Report • Website: https://aegeanboatreport.com/ • Facebook: https://www.facebook.com/AegeanBoatReport/ • Instagram: @aegeanboatreport • X (Twitter): @ABoatReport",
                                        "donation": 26323,
                                        "donation_count": 482,
                                        "end_date": "9999-12-31",
                                        "end_date_ts": 253402214400,
                                        "fundraiser_id": 102576,
                                        "id": "102576",
                                        "is_draft": 0,
                                        "is_findable": 1,
                                        "is_opened": 1,
                                        "live": 1,
                                        "offline_donation": 0,
                                        "profile": {
                                            "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/profile_image/da5dc2c2e7634a47/public",
                                            "name": "Aegean Boat Report"
                                        },
                                        "show_donation_details": 1,
                                        "show_received_donations": 1,
                                        "slug": "the-only-eyes-on-the-aegean-sea-and-theyre-about-to-go-dark",
                                        "title": "🚨The Only Eyes on the Aegean Sea - and They’re About to Go Dark",
                                        "total_donation_eur": 26324.87,
                                        "translation": {
                                            "title_en": "🚨The Only Eyes on the Aegean Sea - and They’re About to Go Dark",
                                            "description_en": "Aegean Boat Report, the only independent watchdog documenting what happens to refugees crossing the Aegean Sea is at risk of shutting down. With your support, we can keep this life-saving work alive and ensure that every person at Europe’s border is seen and protected. In 2015, Norwegian volunteer Tommy Olsen stood on the beaches of Lesvos, Greece, helping families escape war and persecution. What he witnessed would change his life forever and lead to the creation of Aegean Boat Report (ABR) , a one-man effort that grew into Europe’s only independent watchdog on the Aegean Sea . Tommy saw that the biggest challenge was not just the danger of the sea, but the absence of reliable information. He returned home to Tromsø determined to change that. By 2017, he had built a network that tracked every boat, every arrival, and every pushback in real time, providing verified data to humanitarian groups and the public. Today, Aegean Boat Report’s evidence is used by journalists, lawyers, UN agencies, and human-rights defenders around the world. What We Do — Every Day, Every Hour Aegean Boat Report operates a 24/7 hotline that responds to distress calls from families at sea. When messages for help come in, ABR verifies their location, alerts authorities, and stays connected until rescue is confirmed. This has saved lives, again and again. The organisation also documents and verifies human-rights violations, including illegal pushbacks carried out by European border forces. Its verified data has been cited by Amnesty International , Human Rights Watch , and international media outlets. ABR receives no government funding, it depends entirely on individual supporters who believe that truth, transparency, and human dignity must be protected. Why We Need Your Help Without sustainable funding, Aegean Boat Report will be forced to scale down or close. That would mean: • No one left to answer distress calls from people at sea. • No independent documentation of pushbacks and disappearances. • No witnesses to what happens at Europe’s maritime border. If Aegean Boat Report disappears, the truth disappears beneath the waves, and so do the people. This Is Not Charity — It’s Human Rights Work Every contribution helps ABR continue documenting violations, saving lives, and holding governments accountable. €25 helps verify a distress call. €100 keeps the hotline running for a day. €500 funds field monitoring for a week. Your donation keeps the only independent eyes on the Aegean open — and ensures that every life is seen, counted, and remembered. Please, donate today to keep Aegean Boat Report alive. Learn More About Aegean Boat Report • Website: https://aegeanboatreport.com/ • Facebook: https://www.facebook.com/AegeanBoatReport/ • Instagram: @aegeanboatreport • X (Twitter): @ABoatReport"
                                        },
                                        "type": "organisation",
                                        "updated_at": "2026-08-26 09:43:43.857662",
                                        "updated_at_ts": 1787737423,
                                        "video": "https://youtu.be/_62W_ahIjlg",
                                        "donations_last_7d": 9,
                                        "donations_last_14d": 14,
                                        "donations_last_30d": 22,
                                        "recommendation_rank_score": 0.550601,
                                        "trending_window_days": 7,
                                        "trending_score": 9
                                    }
                                },
                                {
                                    "_source": {
                                        "amount_target": 50000,
                                        "appeal": "",
                                        "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/80bfc0724fbb49b1/public",
                                        "base_lang_code": "en",
                                        "category": "22",
                                        "connected_fundraiser_donation": 0,
                                        "content": "My name is Nilgün, and I am 31 years old.\r\n\r\nOn September 3, 2025, my own father shot me three times in my left leg with a shotgun because I refused to live by his rules.\r\n\r\nI spent one and a half months in the hospital, including one month in the intensive care unit. I underwent 10 surgeries, and my heart stopped several times. Surviving was incredibly difficult.\r\n\r\nA severe infection spread throughout my body. Metal external fixators were placed on my left leg, and despite multiple surgeries, my leg could not be saved because all of the main arteries had been destroyed when I was shot. Without blood circulation, the tissue died. The doctors attempted an arterial graft using an artery from my right leg, but unfortunately, it was unsuccessful. There were also medical complications and hospital negligence along the way.\r\n\r\nIn the end, my left leg had to be amputated above the knee.\r\n\r\nAfter my amputation, a foundation promised to provide me with a prosthetic leg, but I waited nearly four months without hearing from them. Later, an international charity donated $2,300 for a basic prosthesis. Unfortunately, the socket did not fit properly, and I needed about another $1,000 to correct the problem, but they were unable to help further.\r\n\r\nToday, I have no prosthetic leg at all. A high-quality prosthesis suitable for a young, active person like me costs around $40,000–$50,000. To be honest, I have very little hope anymore because I have been trying for almost a year without success.\r\n\r\nI had managed to save some money toward a prosthesis, but it was spent on transportation to medical appointments for the prosthesis I couldn’t even use, as well as on other urgent healthcare expenses. At this moment, I have no savings left for a new prosthesis.\r\n\r\nPlease help me take my first steps again. More than anything, I dream of being able to walk like everyone else. Becoming disabled at such a young age has deeply affected my confidence. I often feel worthless and unattractive because of everything I have been through.\r\n\r\nEven the smallest donation brings me one step closer to walking again. Thank you from the bottom of my heart for reading my story and for any support you can give.",
                                        "created_at_ts": 1785587157,
                                        "currency_code": "usd",
                                        "currency_symbol": "$",
                                        "deleted": 0,
                                        "description": "My name is Nilgün, and I am 31 years old.\r\n\r\nOn September 3, 2025, my own father shot me three times in my left leg with a shotgun because I refused to live by his rules.\r\n\r\nI spent one and a half months in the hospital, including one month in the intensive care unit. I underwent 10 surgeries, and my heart stopped several times. Surviving was incredibly difficult.\r\n\r\nA severe infection spread throughout my body. Metal external fixators were placed on my left leg, and despite multiple surgeries, my leg could not be saved because all of the main arteries had been destroyed when I was shot. Without blood circulation, the tissue died. The doctors attempted an arterial graft using an artery from my right leg, but unfortunately, it was unsuccessful. There were also medical complications and hospital negligence along the way.\r\n\r\nIn the end, my left leg had to be amputated above the knee.\r\n\r\nAfter my amputation, a foundation promised to provide me with a prosthetic leg, but I waited nearly four months without hearing from them. Later, an international charity donated $2,300 for a basic prosthesis. Unfortunately, the socket did not fit properly, and I needed about another $1,000 to correct the problem, but they were unable to help further.\r\n\r\nToday, I have no prosthetic leg at all. A high-quality prosthesis suitable for a young, active person like me costs around $40,000–$50,000. To be honest, I have very little hope anymore because I have been trying for almost a year without success.\r\n\r\nI had managed to save some money toward a prosthesis, but it was spent on transportation to medical appointments for the prosthesis I couldn’t even use, as well as on other urgent healthcare expenses. At this moment, I have no savings left for a new prosthesis.\r\n\r\nPlease help me take my first steps again. More than anything, I dream of being able to walk like everyone else. Becoming disabled at such a young age has deeply affected my confidence. I often feel worthless and unattractive because of everything I have been through.\r\n\r\nEven the smallest donation brings me one step closer to walking again. Thank you from the bottom of my heart for reading my story and for any support you can give.",
                                        "donation": 14865,
                                        "donation_count": 489,
                                        "end_date": "9999-12-31",
                                        "end_date_ts": 253402214400,
                                        "fundraiser_id": 132862,
                                        "id": "132862",
                                        "is_draft": 0,
                                        "is_findable": 1,
                                        "is_opened": 1,
                                        "live": 1,
                                        "offline_donation": 0,
                                        "profile": {
                                            "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/profile_image/0418d79e3da34cfd/public",
                                            "name": "Nilgün Kıtay"
                                        },
                                        "show_donation_details": 1,
                                        "show_received_donations": 1,
                                        "slug": "please-help-me-walk-again-",
                                        "title": " Help Me Walk Again",
                                        "total_donation_eur": 12799.69,
                                        "translation": {
                                            "title_en": " Help Me Walk Again",
                                            "description_en": "My name is Nilgün, and I am 31 years old.\r\n\r\nOn September 3, 2025, my own father shot me three times in my left leg with a shotgun because I refused to live by his rules.\r\n\r\nI spent one and a half months in the hospital, including one month in the intensive care unit. I underwent 10 surgeries, and my heart stopped several times. Surviving was incredibly difficult.\r\n\r\nA severe infection spread throughout my body. Metal external fixators were placed on my left leg, and despite multiple surgeries, my leg could not be saved because all of the main arteries had been destroyed when I was shot. Without blood circulation, the tissue died. The doctors attempted an arterial graft using an artery from my right leg, but unfortunately, it was unsuccessful. There were also medical complications and hospital negligence along the way.\r\n\r\nIn the end, my left leg had to be amputated above the knee.\r\n\r\nAfter my amputation, a foundation promised to provide me with a prosthetic leg, but I waited nearly four months without hearing from them. Later, an international charity donated $2,300 for a basic prosthesis. Unfortunately, the socket did not fit properly, and I needed about another $1,000 to correct the problem, but they were unable to help further.\r\n\r\nToday, I have no prosthetic leg at all. A high-quality prosthesis suitable for a young, active person like me costs around $40,000–$50,000. To be honest, I have very little hope anymore because I have been trying for almost a year without success.\r\n\r\nI had managed to save some money toward a prosthesis, but it was spent on transportation to medical appointments for the prosthesis I couldn’t even use, as well as on other urgent healthcare expenses. At this moment, I have no savings left for a new prosthesis.\r\n\r\nPlease help me take my first steps again. More than anything, I dream of being able to walk like everyone else. Becoming disabled at such a young age has deeply affected my confidence. I often feel worthless and unattractive because of everything I have been through.\r\n\r\nEven the smallest donation brings me one step closer to walking again. Thank you from the bottom of my heart for reading my story and for any support you can give."
                                        },
                                        "type": "personal",
                                        "updated_at": "2026-08-26T13:05:04.826Z",
                                        "updated_at_ts": 1787749504,
                                        "video": "",
                                        "donations_last_7d": 143,
                                        "donations_last_14d": 220,
                                        "donations_last_30d": 489,
                                        "recommendation_rank_score": 0.540149,
                                        "trending_window_days": 7,
                                        "trending_score": 143
                                    }
                                },
                                {
                                    "_source": {
                                        "amount_target": 0,
                                        "appeal": "",
                                        "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/fundraiser_header/4f58644c8afe4415/public",
                                        "base_lang_code": "en",
                                        "category": "6",
                                        "connected_fundraiser_donation": 0,
                                        "content": "A Humanitarian Story from Gaza: Displacement, Destruction, and Loss of Hope\r\n\r\nMy name is  ABO ANAS , and I am from Gaza. I used to live a simple life, working as aBeekeeping  and supporting my family of 4 people. I had a simple dream, which was to create a small project for beekeeping and producing natural honey. I had already started to realize this dream, and I was happy to see my project grow day by day.\r\n\r\nBut, as you know, war in Gaza shows no mercy to anyone. In an instant, our lives turned into a nightmare. We were forced to leave our home, which held our beautiful memories, and were forcibly displaced to another place. We took with us only a few clothes and personal belongings.\r\n\r\nAn Unbelievable Shock\r\n\r\nWhen we returned after the end of the war, we did not find our home. It was completely destroyed, and nothing remained of it but a pile of rubble. We lost everything, our home that sheltered us, our furniture, our belongings, and even our photos and memories.\r\n\r\n My Dream Shattered\r\n\r\nMy losses did not stop there. I also lost my own beekeeping project, which was my only source of livelihood. The beehives were destroyed, and the equipment and tools that I bought with difficulty were damaged.\r\n\r\n### A Suffocating Financial Crisis\r\n\r\nI am now homeless and jobless. I cannot provide food, medicine, or even milk for my children. Debts have accumulated on us, and we are in a suffocating financial crisis.\r\n\r\n I Need Your Help\r\n\r\nI appeal to you, good people, to help me in this difficult ordeal. Your donations will help me provide shelter for my family, and will enable me to rebuild my own beekeeping project. I need urgent expenses to meet our basic needs, and to be able to start again.\r\n\r\nI Will Not Give Up Hope\r\n\r\nDespite all these difficulties, I will not give up hope for a better future. I believe that you will support me, and that with your help I will be able to overcome this ordeal.\r\n\r\n Thank You\r\n\r\nI thank you from the bottom of my heart for your support and donations. May God reward you.\r\n\r\n You can donate now and contribute to saving my family.\r\n\r\nPlease share this campaign with your friends and families to raise awareness of our suffering.\r\n\r\nThank you.",
                                        "created_at_ts": 1755793810,
                                        "currency_code": "eur",
                                        "currency_symbol": "€",
                                        "deleted": 0,
                                        "description": "A Humanitarian Story from Gaza: Displacement, Destruction, and Loss of Hope\r\n\r\nMy name is  ABO ANAS , and I am from Gaza. I used to live a simple life, working as aBeekeeping  and supporting my family of 4 people. I had a simple dream, which was to create a small project for beekeeping and producing natural honey. I had already started to realize this dream, and I was happy to see my project grow day by day.\r\n\r\nBut, as you know, war in Gaza shows no mercy to anyone. In an instant, our lives turned into a nightmare. We were forced to leave our home, which held our beautiful memories, and were forcibly displaced to another place. We took with us only a few clothes and personal belongings.\r\n\r\nAn Unbelievable Shock\r\n\r\nWhen we returned after the end of the war, we did not find our home. It was completely destroyed, and nothing remained of it but a pile of rubble. We lost everything, our home that sheltered us, our furniture, our belongings, and even our photos and memories.\r\n\r\n My Dream Shattered\r\n\r\nMy losses did not stop there. I also lost my own beekeeping project, which was my only source of livelihood. The beehives were destroyed, and the equipment and tools that I bought with difficulty were damaged.\r\n\r\n### A Suffocating Financial Crisis\r\n\r\nI am now homeless and jobless. I cannot provide food, medicine, or even milk for my children. Debts have accumulated on us, and we are in a suffocating financial crisis.\r\n\r\n I Need Your Help\r\n\r\nI appeal to you, good people, to help me in this difficult ordeal. Your donations will help me provide shelter for my family, and will enable me to rebuild my own beekeeping project. I need urgent expenses to meet our basic needs, and to be able to start again.\r\n\r\nI Will Not Give Up Hope\r\n\r\nDespite all these difficulties, I will not give up hope for a better future. I believe that you will support me, and that with your help I will be able to overcome this ordeal.\r\n\r\n Thank You\r\n\r\nI thank you from the bottom of my heart for your support and donations. May God reward you.\r\n\r\n You can donate now and contribute to saving my family.\r\n\r\nPlease share this campaign with your friends and families to raise awareness of our suffering.\r\n\r\nThank you.",
                                        "donation": 14773,
                                        "donation_count": 308,
                                        "end_date": "9999-12-31",
                                        "end_date_ts": 253402214400,
                                        "fundraiser_id": 93086,
                                        "id": "93086",
                                        "is_draft": 0,
                                        "is_findable": 1,
                                        "is_opened": 1,
                                        "live": 1,
                                        "offline_donation": 0,
                                        "profile": {
                                            "background": "https://whydonate.com/cdn-cgi/imagedelivery/_0vgnXOEIHPwLg2E52a7gg/production/profile_image/9acf894fab6a401e/public",
                                            "name": "Palestijnsdag"
                                        },
                                        "show_donation_details": 1,
                                        "slug": "save-abu-anas-family-in-gaza",
                                        "title": "Save Abu Anas' family in Gaza",
                                        "total_donation_eur": 14766.06,
                                        "translation": {
                                            "title_en": "",
                                            "description_en": ""
                                        },
                                        "type": "organisation",
                                        "updated_at": "2026-08-25T21:03:19.359Z",
                                        "updated_at_ts": 1787691799,
                                        "video": "",
                                        "donations_last_7d": 8,
                                        "donations_last_14d": 12,
                                        "donations_last_30d": 27,
                                        "recommendation_rank_score": 0.53733,
                                        "trending_window_days": 7,
                                        "trending_score": 8
                                    }
                                }
                            ],
                            "meta": {
                                "page": 1,
                                "per_page": 8,
                                "total": 30,
                                "context": "home",
                                "personalize": true,
                                "semantic_used": false,
                                "semantic_query_source": "none",
                                "trending_window_days": 7,
                                "ab_bucket": "control",
                                "weights_version": "env",
                                "topic": null,
                                "filters_applied": {
                                    "live": true,
                                    "findable": true,
                                    "draft": false,
                                    "opened": true,
                                    "type": "personal,organisation",
                                    "category": "",
                                    "has_target_or_collected_amount": true,
                                    "show_received_donations": true,
                                    "stripe_payment_ready": true
                                },
                                "visitor": {
                                    "country": "NL",
                                    "top_language": "en",
                                    "currency": "eur"
                                }
                            }
                        },
                        "errors": {
                        },
                        "status": 200
                    },
                    "h": {
                    },
                    "s": 200,
                    "st": "OK",
                    "u": "https://fundraiser.whydonate.dev/fundraiser/recommendations/",
                    "rt": "json"
                },
                "__nghData__": [
                    {
                        "t": {
                            "0": "t2"
                        },
                        "c": {
                            "0": [
                            ]
                        }
                    },
                    {
                        "n": {
                            "1": "hfn3"
                        },
                        "t": {
                            "1": "t3"
                        },
                        "c": {
                            "1": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t7",
                            "1": "t8"
                        },
                        "c": {
                            "0": [
                            ],
                            "1": [
                            ]
                        }
                    },
                    {
                    },
                    {
                        "t": {
                            "0": "t72",
                            "1": "t77",
                            "2": "t78",
                            "3": "t79",
                            "4": "t80",
                            "5": "t81",
                            "6": "t74"
                        },
                        "c": {
                            "0": [
                                {
                                    "i": "t72",
                                    "r": 1,
                                    "t": {
                                        "1": "t73"
                                    },
                                    "c": {
                                        "1": [
                                            {
                                                "i": "t74",
                                                "r": 3,
                                                "t": {
                                                    "0": "t75",
                                                    "1": "t76"
                                                },
                                                "c": {
                                                    "0": [
                                                        {
                                                            "i": "t75",
                                                            "r": 1
                                                        }
                                                    ],
                                                    "1": [
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ],
                            "1": [
                            ],
                            "2": [
                            ],
                            "3": [
                            ],
                            "4": [
                            ],
                            "5": [
                            ],
                            "6": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t72",
                            "1": "t77",
                            "2": "t78",
                            "3": "t79",
                            "4": "t80",
                            "5": "t81",
                            "6": "t74"
                        },
                        "c": {
                            "0": [
                            ],
                            "1": [
                            ],
                            "2": [
                            ],
                            "3": [
                            ],
                            "4": [
                            ],
                            "5": [
                                {
                                    "i": "t81",
                                    "r": 1,
                                    "t": {
                                        "1": "t83"
                                    },
                                    "c": {
                                        "1": [
                                            {
                                                "i": "t74",
                                                "r": 3,
                                                "t": {
                                                    "0": "t75",
                                                    "1": "t76"
                                                },
                                                "c": {
                                                    "0": [
                                                        {
                                                            "i": "t75",
                                                            "r": 1
                                                        }
                                                    ],
                                                    "1": [
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ],
                            "6": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "4": "t71",
                            "6": "t82",
                            "10": "t84",
                            "11": "t85",
                            "12": "t89"
                        },
                        "c": {
                            "4": [
                                {
                                    "i": "t71",
                                    "r": 1
                                }
                            ],
                            "6": [
                                {
                                    "i": "t82",
                                    "r": 1
                                }
                            ],
                            "10": [
                                {
                                    "i": "t84",
                                    "r": 1
                                }
                            ],
                            "11": [
                                {
                                    "i": "t85",
                                    "r": 1,
                                    "t": {
                                        "5": "t86",
                                        "9": "t87"
                                    },
                                    "c": {
                                        "5": [
                                            {
                                                "i": "t86",
                                                "r": 1,
                                                "x": 15
                                            }
                                        ],
                                        "9": [
                                            {
                                                "i": "t87",
                                                "r": 1,
                                                "t": {
                                                    "2": "t88"
                                                },
                                                "c": {
                                                    "2": [
                                                        {
                                                            "i": "t88",
                                                            "r": 1
                                                        }
                                                    ]
                                                },
                                                "x": 15
                                            }
                                        ]
                                    }
                                }
                            ],
                            "12": [
                                {
                                    "i": "t89",
                                    "r": 1,
                                    "t": {
                                        "3": "t90"
                                    },
                                    "c": {
                                        "3": [
                                            {
                                                "i": "t90",
                                                "r": 3,
                                                "t": {
                                                    "1": "t91",
                                                    "5": "t92"
                                                },
                                                "c": {
                                                    "1": [
                                                        {
                                                            "i": "t91",
                                                            "r": 1
                                                        }
                                                    ],
                                                    "5": [
                                                        {
                                                            "i": "t92",
                                                            "r": 1
                                                        }
                                                    ]
                                                },
                                                "x": 3
                                            },
                                            {
                                                "i": "t90",
                                                "r": 2,
                                                "t": {
                                                    "1": "t91",
                                                    "5": "t92"
                                                },
                                                "c": {
                                                    "1": [
                                                        {
                                                            "i": "t91",
                                                            "r": 1
                                                        }
                                                    ],
                                                    "5": [
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t12",
                            "1": "t13",
                            "2": "t14",
                            "3": "t15",
                            "4": "t16",
                            "5": "t17",
                            "6": "t18",
                            "7": "t19",
                            "8": "t20",
                            "9": "t21",
                            "10": "t22",
                            "11": "t23",
                            "12": "t24",
                            "13": "t25",
                            "14": "t26",
                            "15": "t27",
                            "16": "t28",
                            "17": "t29",
                            "18": "t30",
                            "19": "t31",
                            "20": "t32",
                            "21": "t33",
                            "22": "t34",
                            "23": "t35",
                            "24": "t36",
                            "25": "t37",
                            "26": "t38",
                            "27": "t39",
                            "28": "t40",
                            "29": "t41",
                            "30": "t42",
                            "31": "t43",
                            "32": "t44",
                            "33": "t45",
                            "34": "t46",
                            "35": "t47",
                            "36": "t48",
                            "37": "t49",
                            "38": "t50",
                            "39": "t51",
                            "40": "t52",
                            "41": "t53",
                            "42": "t54",
                            "43": "t55",
                            "44": "t56",
                            "45": "t57",
                            "46": "t58",
                            "47": "t59",
                            "48": "t60",
                            "49": "t61",
                            "50": "t62",
                            "51": "t63",
                            "52": "t64",
                            "53": "t65",
                            "54": "t66",
                            "55": "t67",
                            "56": "t68",
                            "57": "t69",
                            "58": "t70",
                            "59": "t93",
                            "60": "t94",
                            "61": "t95",
                            "62": "t96",
                            "63": "t97",
                            "64": "t98",
                            "65": "t99",
                            "66": "t100",
                            "67": "t101",
                            "68": "t102",
                            "69": "t103",
                            "70": "t104"
                        },
                        "c": {
                            "0": [
                            ],
                            "1": [
                            ],
                            "2": [
                            ],
                            "3": [
                            ],
                            "4": [
                            ],
                            "5": [
                            ],
                            "6": [
                            ],
                            "7": [
                            ],
                            "8": [
                            ],
                            "9": [
                            ],
                            "10": [
                            ],
                            "11": [
                            ],
                            "12": [
                            ],
                            "13": [
                            ],
                            "14": [
                            ],
                            "15": [
                            ],
                            "16": [
                            ],
                            "17": [
                            ],
                            "18": [
                            ],
                            "19": [
                            ],
                            "20": [
                            ],
                            "21": [
                            ],
                            "22": [
                            ],
                            "23": [
                            ],
                            "24": [
                            ],
                            "25": [
                            ],
                            "26": [
                            ],
                            "27": [
                            ],
                            "28": [
                            ],
                            "29": [
                            ],
                            "30": [
                            ],
                            "31": [
                            ],
                            "32": [
                            ],
                            "33": [
                            ],
                            "34": [
                            ],
                            "35": [
                            ],
                            "36": [
                            ],
                            "37": [
                            ],
                            "38": [
                            ],
                            "39": [
                            ],
                            "40": [
                            ],
                            "41": [
                            ],
                            "42": [
                            ],
                            "43": [
                            ],
                            "44": [
                            ],
                            "45": [
                            ],
                            "46": [
                            ],
                            "47": [
                            ],
                            "48": [
                            ],
                            "49": [
                            ],
                            "50": [
                            ],
                            "51": [
                            ],
                            "52": [
                            ],
                            "53": [
                            ],
                            "54": [
                            ],
                            "55": [
                            ],
                            "56": [
                            ],
                            "57": [
                            ],
                            "58": [
                                {
                                    "i": "t70",
                                    "r": 1
                                }
                            ],
                            "59": [
                            ],
                            "60": [
                            ],
                            "61": [
                            ],
                            "62": [
                            ],
                            "63": [
                            ],
                            "64": [
                            ],
                            "65": [
                            ],
                            "66": [
                            ],
                            "67": [
                            ],
                            "68": [
                            ],
                            "69": [
                            ],
                            "70": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t72",
                            "1": "t77",
                            "2": "t78",
                            "3": "t79",
                            "4": "t80",
                            "5": "t81",
                            "6": "t74"
                        },
                        "c": {
                            "0": [
                            ],
                            "1": [
                                {
                                    "i": "t77",
                                    "r": 1,
                                    "t": {
                                        "1": "t108"
                                    },
                                    "c": {
                                        "1": [
                                            {
                                                "i": "t74",
                                                "r": 3,
                                                "t": {
                                                    "0": "t75",
                                                    "1": "t76"
                                                },
                                                "c": {
                                                    "0": [
                                                        {
                                                            "i": "t75",
                                                            "r": 1
                                                        }
                                                    ],
                                                    "1": [
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ],
                            "2": [
                            ],
                            "3": [
                            ],
                            "4": [
                            ],
                            "5": [
                            ],
                            "6": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "2": "t113",
                            "3": "t114",
                            "7": "t115"
                        },
                        "c": {
                            "2": [
                                {
                                    "i": "t113",
                                    "r": 1
                                }
                            ],
                            "3": [
                                {
                                    "i": "t114",
                                    "r": 1
                                }
                            ],
                            "7": [
                                {
                                    "i": "t115",
                                    "r": 1,
                                    "t": {
                                        "2": "t116"
                                    },
                                    "c": {
                                        "2": [
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "t": {
                            "3": "t107",
                            "5": "t109",
                            "6": "t111",
                            "7": "t117",
                            "8": "t118"
                        },
                        "c": {
                            "3": [
                                {
                                    "i": "t107",
                                    "r": 1
                                }
                            ],
                            "5": [
                                {
                                    "i": "t109",
                                    "r": 1,
                                    "t": {
                                        "4": "t110"
                                    },
                                    "c": {
                                        "4": [
                                            {
                                                "i": "t110",
                                                "r": 1,
                                                "x": 5
                                            }
                                        ]
                                    }
                                }
                            ],
                            "6": [
                                {
                                    "i": "t111",
                                    "r": 1,
                                    "t": {
                                        "2": "t112"
                                    },
                                    "c": {
                                        "2": [
                                            {
                                                "i": "t112",
                                                "r": 1,
                                                "x": 8
                                            }
                                        ]
                                    }
                                }
                            ],
                            "7": [
                            ],
                            "8": [
                                {
                                    "i": "t118",
                                    "r": 1
                                }
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t12",
                            "1": "t13",
                            "2": "t14",
                            "3": "t15",
                            "4": "t16",
                            "5": "t17",
                            "6": "t18",
                            "7": "t19",
                            "8": "t20",
                            "9": "t21",
                            "10": "t22",
                            "11": "t23",
                            "12": "t24",
                            "13": "t25",
                            "14": "t26",
                            "15": "t27",
                            "16": "t28",
                            "17": "t29",
                            "18": "t30",
                            "19": "t31",
                            "20": "t32",
                            "21": "t33",
                            "22": "t34",
                            "23": "t35",
                            "24": "t36",
                            "25": "t37",
                            "26": "t38",
                            "27": "t39",
                            "28": "t40",
                            "29": "t41",
                            "30": "t42",
                            "31": "t43",
                            "32": "t44",
                            "33": "t45",
                            "34": "t46",
                            "35": "t47",
                            "36": "t48",
                            "37": "t49",
                            "38": "t50",
                            "39": "t51",
                            "40": "t52",
                            "41": "t53",
                            "42": "t54",
                            "43": "t55",
                            "44": "t56",
                            "45": "t57",
                            "46": "t58",
                            "47": "t59",
                            "48": "t60",
                            "49": "t61",
                            "50": "t62",
                            "51": "t63",
                            "52": "t64",
                            "53": "t65",
                            "54": "t66",
                            "55": "t67",
                            "56": "t68",
                            "57": "t69",
                            "58": "t70",
                            "59": "t93",
                            "60": "t94",
                            "61": "t95",
                            "62": "t96",
                            "63": "t97",
                            "64": "t98",
                            "65": "t99",
                            "66": "t100",
                            "67": "t101",
                            "68": "t102",
                            "69": "t103",
                            "70": "t104"
                        },
                        "c": {
                            "0": [
                            ],
                            "1": [
                            ],
                            "2": [
                            ],
                            "3": [
                            ],
                            "4": [
                            ],
                            "5": [
                            ],
                            "6": [
                            ],
                            "7": [
                            ],
                            "8": [
                            ],
                            "9": [
                            ],
                            "10": [
                            ],
                            "11": [
                            ],
                            "12": [
                            ],
                            "13": [
                            ],
                            "14": [
                            ],
                            "15": [
                            ],
                            "16": [
                            ],
                            "17": [
                            ],
                            "18": [
                            ],
                            "19": [
                            ],
                            "20": [
                            ],
                            "21": [
                            ],
                            "22": [
                            ],
                            "23": [
                            ],
                            "24": [
                            ],
                            "25": [
                            ],
                            "26": [
                            ],
                            "27": [
                            ],
                            "28": [
                            ],
                            "29": [
                            ],
                            "30": [
                            ],
                            "31": [
                            ],
                            "32": [
                            ],
                            "33": [
                            ],
                            "34": [
                            ],
                            "35": [
                            ],
                            "36": [
                            ],
                            "37": [
                            ],
                            "38": [
                            ],
                            "39": [
                            ],
                            "40": [
                            ],
                            "41": [
                            ],
                            "42": [
                            ],
                            "43": [
                            ],
                            "44": [
                            ],
                            "45": [
                            ],
                            "46": [
                            ],
                            "47": [
                            ],
                            "48": [
                            ],
                            "49": [
                            ],
                            "50": [
                            ],
                            "51": [
                            ],
                            "52": [
                            ],
                            "53": [
                            ],
                            "54": [
                            ],
                            "55": [
                            ],
                            "56": [
                            ],
                            "57": [
                            ],
                            "58": [
                            ],
                            "59": [
                                {
                                    "i": "t93",
                                    "r": 3,
                                    "t": {
                                        "0": "t105",
                                        "1": "t106"
                                    },
                                    "c": {
                                        "0": [
                                        ],
                                        "1": [
                                            {
                                                "i": "t105",
                                                "r": 1,
                                                "di": "d0",
                                                "s": 2
                                            }
                                        ]
                                    }
                                }
                            ],
                            "60": [
                            ],
                            "61": [
                            ],
                            "62": [
                            ],
                            "63": [
                            ],
                            "64": [
                            ],
                            "65": [
                            ],
                            "66": [
                            ],
                            "67": [
                            ],
                            "68": [
                            ],
                            "69": [
                            ],
                            "70": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "3": "t121",
                            "5": "t122",
                            "9": "t123",
                            "28": "t124",
                            "29": "t125",
                            "32": "t126",
                            "57": "t128",
                            "77": "t135",
                            "92": "t137"
                        },
                        "c": {
                            "3": [
                                {
                                    "i": "t121",
                                    "r": 1
                                }
                            ],
                            "5": [
                                {
                                    "i": "t122",
                                    "r": 1
                                }
                            ],
                            "9": [
                                {
                                    "i": "t123",
                                    "r": 1,
                                    "x": 5
                                }
                            ],
                            "28": [
                                {
                                    "i": "t124",
                                    "r": 1
                                }
                            ],
                            "29": [
                                {
                                    "i": "t125",
                                    "r": 1
                                }
                            ],
                            "32": [
                                {
                                    "i": "t126",
                                    "r": 1,
                                    "t": {
                                        "1": "t127"
                                    },
                                    "c": {
                                        "1": [
                                            {
                                                "i": "t127",
                                                "r": 1
                                            }
                                        ]
                                    }
                                },
                                {
                                    "i": "t126",
                                    "r": 1,
                                    "t": {
                                        "1": "t127"
                                    },
                                    "c": {
                                        "1": [
                                        ]
                                    },
                                    "x": 2
                                }
                            ],
                            "57": [
                                {
                                    "i": "t128",
                                    "r": 1,
                                    "t": {
                                        "1": "t129",
                                        "2": "t130",
                                        "3": "t131",
                                        "4": "t132",
                                        "5": "t133",
                                        "6": "t134"
                                    },
                                    "c": {
                                        "1": [
                                            {
                                                "i": "t129",
                                                "r": 1
                                            }
                                        ],
                                        "2": [
                                        ],
                                        "3": [
                                        ],
                                        "4": [
                                        ],
                                        "5": [
                                        ],
                                        "6": [
                                        ]
                                    }
                                },
                                {
                                    "i": "t128",
                                    "r": 1,
                                    "t": {
                                        "1": "t129",
                                        "2": "t130",
                                        "3": "t131",
                                        "4": "t132",
                                        "5": "t133",
                                        "6": "t134"
                                    },
                                    "c": {
                                        "1": [
                                        ],
                                        "2": [
                                            {
                                                "i": "t130",
                                                "r": 1
                                            }
                                        ],
                                        "3": [
                                        ],
                                        "4": [
                                        ],
                                        "5": [
                                        ],
                                        "6": [
                                        ]
                                    }
                                },
                                {
                                    "i": "t128",
                                    "r": 1,
                                    "t": {
                                        "1": "t129",
                                        "2": "t130",
                                        "3": "t131",
                                        "4": "t132",
                                        "5": "t133",
                                        "6": "t134"
                                    },
                                    "c": {
                                        "1": [
                                        ],
                                        "2": [
                                        ],
                                        "3": [
                                            {
                                                "i": "t131",
                                                "r": 1
                                            }
                                        ],
                                        "4": [
                                        ],
                                        "5": [
                                        ],
                                        "6": [
                                        ]
                                    }
                                },
                                {
                                    "i": "t128",
                                    "r": 1,
                                    "t": {
                                        "1": "t129",
                                        "2": "t130",
                                        "3": "t131",
                                        "4": "t132",
                                        "5": "t133",
                                        "6": "t134"
                                    },
                                    "c": {
                                        "1": [
                                        ],
                                        "2": [
                                        ],
                                        "3": [
                                        ],
                                        "4": [
                                            {
                                                "i": "t132",
                                                "r": 1
                                            }
                                        ],
                                        "5": [
                                        ],
                                        "6": [
                                        ]
                                    }
                                },
                                {
                                    "i": "t128",
                                    "r": 1,
                                    "t": {
                                        "1": "t129",
                                        "2": "t130",
                                        "3": "t131",
                                        "4": "t132",
                                        "5": "t133",
                                        "6": "t134"
                                    },
                                    "c": {
                                        "1": [
                                        ],
                                        "2": [
                                        ],
                                        "3": [
                                        ],
                                        "4": [
                                        ],
                                        "5": [
                                            {
                                                "i": "t133",
                                                "r": 1
                                            }
                                        ],
                                        "6": [
                                        ]
                                    }
                                },
                                {
                                    "i": "t128",
                                    "r": 1,
                                    "t": {
                                        "1": "t129",
                                        "2": "t130",
                                        "3": "t131",
                                        "4": "t132",
                                        "5": "t133",
                                        "6": "t134"
                                    },
                                    "c": {
                                        "1": [
                                        ],
                                        "2": [
                                        ],
                                        "3": [
                                        ],
                                        "4": [
                                        ],
                                        "5": [
                                        ],
                                        "6": [
                                            {
                                                "i": "t134",
                                                "r": 1
                                            }
                                        ]
                                    }
                                }
                            ],
                            "77": [
                                {
                                    "i": "t135",
                                    "r": 1,
                                    "t": {
                                        "1": "t136"
                                    },
                                    "c": {
                                        "1": [
                                        ]
                                    },
                                    "x": 3
                                }
                            ],
                            "92": [
                                {
                                    "i": "t137",
                                    "r": 1,
                                    "x": 2
                                }
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t12",
                            "1": "t13",
                            "2": "t14",
                            "3": "t15",
                            "4": "t16",
                            "5": "t17",
                            "6": "t18",
                            "7": "t19",
                            "8": "t20",
                            "9": "t21",
                            "10": "t22",
                            "11": "t23",
                            "12": "t24",
                            "13": "t25",
                            "14": "t26",
                            "15": "t27",
                            "16": "t28",
                            "17": "t29",
                            "18": "t30",
                            "19": "t31",
                            "20": "t32",
                            "21": "t33",
                            "22": "t34",
                            "23": "t35",
                            "24": "t36",
                            "25": "t37",
                            "26": "t38",
                            "27": "t39",
                            "28": "t40",
                            "29": "t41",
                            "30": "t42",
                            "31": "t43",
                            "32": "t44",
                            "33": "t45",
                            "34": "t46",
                            "35": "t47",
                            "36": "t48",
                            "37": "t49",
                            "38": "t50",
                            "39": "t51",
                            "40": "t52",
                            "41": "t53",
                            "42": "t54",
                            "43": "t55",
                            "44": "t56",
                            "45": "t57",
                            "46": "t58",
                            "47": "t59",
                            "48": "t60",
                            "49": "t61",
                            "50": "t62",
                            "51": "t63",
                            "52": "t64",
                            "53": "t65",
                            "54": "t66",
                            "55": "t67",
                            "56": "t68",
                            "57": "t69",
                            "58": "t70",
                            "59": "t93",
                            "60": "t94",
                            "61": "t95",
                            "62": "t96",
                            "63": "t97",
                            "64": "t98",
                            "65": "t99",
                            "66": "t100",
                            "67": "t101",
                            "68": "t102",
                            "69": "t103",
                            "70": "t104"
                        },
                        "c": {
                            "0": [
                            ],
                            "1": [
                            ],
                            "2": [
                            ],
                            "3": [
                            ],
                            "4": [
                            ],
                            "5": [
                            ],
                            "6": [
                            ],
                            "7": [
                            ],
                            "8": [
                            ],
                            "9": [
                            ],
                            "10": [
                            ],
                            "11": [
                            ],
                            "12": [
                            ],
                            "13": [
                            ],
                            "14": [
                            ],
                            "15": [
                            ],
                            "16": [
                            ],
                            "17": [
                            ],
                            "18": [
                            ],
                            "19": [
                            ],
                            "20": [
                            ],
                            "21": [
                            ],
                            "22": [
                            ],
                            "23": [
                            ],
                            "24": [
                            ],
                            "25": [
                            ],
                            "26": [
                            ],
                            "27": [
                            ],
                            "28": [
                            ],
                            "29": [
                            ],
                            "30": [
                            ],
                            "31": [
                            ],
                            "32": [
                            ],
                            "33": [
                            ],
                            "34": [
                            ],
                            "35": [
                            ],
                            "36": [
                            ],
                            "37": [
                            ],
                            "38": [
                            ],
                            "39": [
                            ],
                            "40": [
                            ],
                            "41": [
                            ],
                            "42": [
                            ],
                            "43": [
                            ],
                            "44": [
                            ],
                            "45": [
                            ],
                            "46": [
                            ],
                            "47": [
                            ],
                            "48": [
                            ],
                            "49": [
                            ],
                            "50": [
                            ],
                            "51": [
                            ],
                            "52": [
                            ],
                            "53": [
                            ],
                            "54": [
                            ],
                            "55": [
                            ],
                            "56": [
                            ],
                            "57": [
                            ],
                            "58": [
                            ],
                            "59": [
                            ],
                            "60": [
                                {
                                    "i": "t94",
                                    "r": 3,
                                    "t": {
                                        "0": "t119",
                                        "1": "t120"
                                    },
                                    "c": {
                                        "0": [
                                        ],
                                        "1": [
                                            {
                                                "i": "t119",
                                                "r": 1,
                                                "di": "d1",
                                                "s": 2
                                            }
                                        ]
                                    }
                                }
                            ],
                            "61": [
                            ],
                            "62": [
                            ],
                            "63": [
                            ],
                            "64": [
                            ],
                            "65": [
                            ],
                            "66": [
                            ],
                            "67": [
                            ],
                            "68": [
                            ],
                            "69": [
                            ],
                            "70": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "2": "t140",
                            "3": "t142",
                            "4": "t143"
                        },
                        "c": {
                            "2": [
                                {
                                    "i": "t140",
                                    "r": 1,
                                    "t": {
                                        "1": "t141"
                                    },
                                    "c": {
                                        "1": [
                                            {
                                                "i": "t141",
                                                "r": 1
                                            }
                                        ]
                                    }
                                }
                            ],
                            "3": [
                                {
                                    "i": "t142",
                                    "r": 1
                                }
                            ],
                            "4": [
                                {
                                    "i": "t143",
                                    "r": 1,
                                    "t": {
                                        "3": "t144"
                                    },
                                    "c": {
                                        "3": [
                                            {
                                                "i": "t144",
                                                "r": 1,
                                                "t": {
                                                    "1": "t145",
                                                    "2": "t146"
                                                },
                                                "c": {
                                                    "1": [
                                                        {
                                                            "i": "t145",
                                                            "r": 1
                                                        }
                                                    ],
                                                    "2": [
                                                    ]
                                                },
                                                "x": 18
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t12",
                            "1": "t13",
                            "2": "t14",
                            "3": "t15",
                            "4": "t16",
                            "5": "t17",
                            "6": "t18",
                            "7": "t19",
                            "8": "t20",
                            "9": "t21",
                            "10": "t22",
                            "11": "t23",
                            "12": "t24",
                            "13": "t25",
                            "14": "t26",
                            "15": "t27",
                            "16": "t28",
                            "17": "t29",
                            "18": "t30",
                            "19": "t31",
                            "20": "t32",
                            "21": "t33",
                            "22": "t34",
                            "23": "t35",
                            "24": "t36",
                            "25": "t37",
                            "26": "t38",
                            "27": "t39",
                            "28": "t40",
                            "29": "t41",
                            "30": "t42",
                            "31": "t43",
                            "32": "t44",
                            "33": "t45",
                            "34": "t46",
                            "35": "t47",
                            "36": "t48",
                            "37": "t49",
                            "38": "t50",
                            "39": "t51",
                            "40": "t52",
                            "41": "t53",
                            "42": "t54",
                            "43": "t55",
                            "44": "t56",
                            "45": "t57",
                            "46": "t58",
                            "47": "t59",
                            "48": "t60",
                            "49": "t61",
                            "50": "t62",
                            "51": "t63",
                            "52": "t64",
                            "53": "t65",
                            "54": "t66",
                            "55": "t67",
                            "56": "t68",
                            "57": "t69",
                            "58": "t70",
                            "59": "t93",
                            "60": "t94",
                            "61": "t95",
                            "62": "t96",
                            "63": "t97",
                            "64": "t98",
                            "65": "t99",
                            "66": "t100",
                            "67": "t101",
                            "68": "t102",
                            "69": "t103",
                            "70": "t104"
                        },
                        "c": {
                            "0": [
                            ],
                            "1": [
                            ],
                            "2": [
                            ],
                            "3": [
                            ],
                            "4": [
                            ],
                            "5": [
                            ],
                            "6": [
                            ],
                            "7": [
                            ],
                            "8": [
                            ],
                            "9": [
                            ],
                            "10": [
                            ],
                            "11": [
                            ],
                            "12": [
                            ],
                            "13": [
                            ],
                            "14": [
                            ],
                            "15": [
                            ],
                            "16": [
                            ],
                            "17": [
                            ],
                            "18": [
                            ],
                            "19": [
                            ],
                            "20": [
                            ],
                            "21": [
                            ],
                            "22": [
                            ],
                            "23": [
                            ],
                            "24": [
                            ],
                            "25": [
                            ],
                            "26": [
                            ],
                            "27": [
                            ],
                            "28": [
                            ],
                            "29": [
                            ],
                            "30": [
                            ],
                            "31": [
                            ],
                            "32": [
                            ],
                            "33": [
                            ],
                            "34": [
                            ],
                            "35": [
                            ],
                            "36": [
                            ],
                            "37": [
                            ],
                            "38": [
                            ],
                            "39": [
                            ],
                            "40": [
                            ],
                            "41": [
                            ],
                            "42": [
                            ],
                            "43": [
                            ],
                            "44": [
                            ],
                            "45": [
                            ],
                            "46": [
                            ],
                            "47": [
                            ],
                            "48": [
                            ],
                            "49": [
                            ],
                            "50": [
                            ],
                            "51": [
                            ],
                            "52": [
                            ],
                            "53": [
                            ],
                            "54": [
                            ],
                            "55": [
                            ],
                            "56": [
                            ],
                            "57": [
                            ],
                            "58": [
                            ],
                            "59": [
                            ],
                            "60": [
                            ],
                            "61": [
                            ],
                            "62": [
                            ],
                            "63": [
                            ],
                            "64": [
                                {
                                    "i": "t98",
                                    "r": 3,
                                    "t": {
                                        "0": "t138",
                                        "1": "t139"
                                    },
                                    "c": {
                                        "0": [
                                        ],
                                        "1": [
                                            {
                                                "i": "t138",
                                                "r": 1,
                                                "di": "d2",
                                                "s": 2
                                            }
                                        ]
                                    }
                                }
                            ],
                            "65": [
                            ],
                            "66": [
                            ],
                            "67": [
                            ],
                            "68": [
                            ],
                            "69": [
                            ],
                            "70": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "3": "t149",
                            "5": "t150",
                            "8": "t151"
                        },
                        "c": {
                            "3": [
                                {
                                    "i": "t149",
                                    "r": 1
                                }
                            ],
                            "5": [
                                {
                                    "i": "t150",
                                    "r": 1
                                }
                            ],
                            "8": [
                                {
                                    "i": "t151",
                                    "r": 1,
                                    "t": {
                                        "2": "t152",
                                        "3": "t154",
                                        "7": "t155",
                                        "8": "t156"
                                    },
                                    "c": {
                                        "2": [
                                            {
                                                "i": "t152",
                                                "r": 1,
                                                "t": {
                                                    "3": "t153"
                                                },
                                                "c": {
                                                    "3": [
                                                        {
                                                            "i": "t153",
                                                            "r": 1
                                                        }
                                                    ]
                                                }
                                            }
                                        ],
                                        "3": [
                                            {
                                                "i": "t154",
                                                "r": 1
                                            }
                                        ],
                                        "7": [
                                            {
                                                "i": "t155",
                                                "r": 1
                                            }
                                        ],
                                        "8": [
                                            {
                                                "i": "t156",
                                                "r": 1
                                            }
                                        ]
                                    },
                                    "x": 3
                                }
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t12",
                            "1": "t13",
                            "2": "t14",
                            "3": "t15",
                            "4": "t16",
                            "5": "t17",
                            "6": "t18",
                            "7": "t19",
                            "8": "t20",
                            "9": "t21",
                            "10": "t22",
                            "11": "t23",
                            "12": "t24",
                            "13": "t25",
                            "14": "t26",
                            "15": "t27",
                            "16": "t28",
                            "17": "t29",
                            "18": "t30",
                            "19": "t31",
                            "20": "t32",
                            "21": "t33",
                            "22": "t34",
                            "23": "t35",
                            "24": "t36",
                            "25": "t37",
                            "26": "t38",
                            "27": "t39",
                            "28": "t40",
                            "29": "t41",
                            "30": "t42",
                            "31": "t43",
                            "32": "t44",
                            "33": "t45",
                            "34": "t46",
                            "35": "t47",
                            "36": "t48",
                            "37": "t49",
                            "38": "t50",
                            "39": "t51",
                            "40": "t52",
                            "41": "t53",
                            "42": "t54",
                            "43": "t55",
                            "44": "t56",
                            "45": "t57",
                            "46": "t58",
                            "47": "t59",
                            "48": "t60",
                            "49": "t61",
                            "50": "t62",
                            "51": "t63",
                            "52": "t64",
                            "53": "t65",
                            "54": "t66",
                            "55": "t67",
                            "56": "t68",
                            "57": "t69",
                            "58": "t70",
                            "59": "t93",
                            "60": "t94",
                            "61": "t95",
                            "62": "t96",
                            "63": "t97",
                            "64": "t98",
                            "65": "t99",
                            "66": "t100",
                            "67": "t101",
                            "68": "t102",
                            "69": "t103",
                            "70": "t104"
                        },
                        "c": {
                            "0": [
                            ],
                            "1": [
                            ],
                            "2": [
                            ],
                            "3": [
                            ],
                            "4": [
                            ],
                            "5": [
                            ],
                            "6": [
                            ],
                            "7": [
                            ],
                            "8": [
                            ],
                            "9": [
                            ],
                            "10": [
                            ],
                            "11": [
                            ],
                            "12": [
                            ],
                            "13": [
                            ],
                            "14": [
                            ],
                            "15": [
                            ],
                            "16": [
                            ],
                            "17": [
                            ],
                            "18": [
                            ],
                            "19": [
                            ],
                            "20": [
                            ],
                            "21": [
                            ],
                            "22": [
                            ],
                            "23": [
                            ],
                            "24": [
                            ],
                            "25": [
                            ],
                            "26": [
                            ],
                            "27": [
                            ],
                            "28": [
                            ],
                            "29": [
                            ],
                            "30": [
                            ],
                            "31": [
                            ],
                            "32": [
                            ],
                            "33": [
                            ],
                            "34": [
                            ],
                            "35": [
                            ],
                            "36": [
                            ],
                            "37": [
                            ],
                            "38": [
                            ],
                            "39": [
                            ],
                            "40": [
                            ],
                            "41": [
                            ],
                            "42": [
                            ],
                            "43": [
                            ],
                            "44": [
                            ],
                            "45": [
                            ],
                            "46": [
                            ],
                            "47": [
                            ],
                            "48": [
                            ],
                            "49": [
                            ],
                            "50": [
                            ],
                            "51": [
                            ],
                            "52": [
                            ],
                            "53": [
                            ],
                            "54": [
                            ],
                            "55": [
                            ],
                            "56": [
                            ],
                            "57": [
                            ],
                            "58": [
                            ],
                            "59": [
                            ],
                            "60": [
                            ],
                            "61": [
                                {
                                    "i": "t95",
                                    "r": 3,
                                    "t": {
                                        "0": "t147",
                                        "1": "t148"
                                    },
                                    "c": {
                                        "0": [
                                        ],
                                        "1": [
                                            {
                                                "i": "t147",
                                                "r": 1,
                                                "di": "d3",
                                                "s": 2
                                            }
                                        ]
                                    }
                                }
                            ],
                            "62": [
                            ],
                            "63": [
                            ],
                            "64": [
                            ],
                            "65": [
                            ],
                            "66": [
                            ],
                            "67": [
                            ],
                            "68": [
                            ],
                            "69": [
                            ],
                            "70": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "3": "t159",
                            "5": "t160",
                            "8": "t161"
                        },
                        "c": {
                            "3": [
                                {
                                    "i": "t159",
                                    "r": 1
                                }
                            ],
                            "5": [
                                {
                                    "i": "t160",
                                    "r": 1
                                }
                            ],
                            "8": [
                                {
                                    "i": "t161",
                                    "r": 1,
                                    "t": {
                                        "6": "t162"
                                    },
                                    "c": {
                                        "6": [
                                            {
                                                "i": "t162",
                                                "r": 1,
                                                "t": {
                                                    "2": "t163"
                                                },
                                                "c": {
                                                    "2": [
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    "i": "t161",
                                    "r": 1,
                                    "t": {
                                        "6": "t162"
                                    },
                                    "c": {
                                        "6": [
                                            {
                                                "i": "t162",
                                                "r": 1,
                                                "t": {
                                                    "2": "t163"
                                                },
                                                "c": {
                                                    "2": [
                                                        {
                                                            "i": "t163",
                                                            "r": 1
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    },
                                    "x": 2
                                },
                                {
                                    "i": "t161",
                                    "r": 1,
                                    "t": {
                                        "6": "t162"
                                    },
                                    "c": {
                                        "6": [
                                            {
                                                "i": "t162",
                                                "r": 1,
                                                "t": {
                                                    "2": "t163"
                                                },
                                                "c": {
                                                    "2": [
                                                    ]
                                                }
                                            }
                                        ]
                                    },
                                    "x": 2
                                },
                                {
                                    "i": "t161",
                                    "r": 1,
                                    "t": {
                                        "6": "t162"
                                    },
                                    "c": {
                                        "6": [
                                            {
                                                "i": "t162",
                                                "r": 1,
                                                "t": {
                                                    "2": "t163"
                                                },
                                                "c": {
                                                    "2": [
                                                        {
                                                            "i": "t163",
                                                            "r": 1
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t12",
                            "1": "t13",
                            "2": "t14",
                            "3": "t15",
                            "4": "t16",
                            "5": "t17",
                            "6": "t18",
                            "7": "t19",
                            "8": "t20",
                            "9": "t21",
                            "10": "t22",
                            "11": "t23",
                            "12": "t24",
                            "13": "t25",
                            "14": "t26",
                            "15": "t27",
                            "16": "t28",
                            "17": "t29",
                            "18": "t30",
                            "19": "t31",
                            "20": "t32",
                            "21": "t33",
                            "22": "t34",
                            "23": "t35",
                            "24": "t36",
                            "25": "t37",
                            "26": "t38",
                            "27": "t39",
                            "28": "t40",
                            "29": "t41",
                            "30": "t42",
                            "31": "t43",
                            "32": "t44",
                            "33": "t45",
                            "34": "t46",
                            "35": "t47",
                            "36": "t48",
                            "37": "t49",
                            "38": "t50",
                            "39": "t51",
                            "40": "t52",
                            "41": "t53",
                            "42": "t54",
                            "43": "t55",
                            "44": "t56",
                            "45": "t57",
                            "46": "t58",
                            "47": "t59",
                            "48": "t60",
                            "49": "t61",
                            "50": "t62",
                            "51": "t63",
                            "52": "t64",
                            "53": "t65",
                            "54": "t66",
                            "55": "t67",
                            "56": "t68",
                            "57": "t69",
                            "58": "t70",
                            "59": "t93",
                            "60": "t94",
                            "61": "t95",
                            "62": "t96",
                            "63": "t97",
                            "64": "t98",
                            "65": "t99",
                            "66": "t100",
                            "67": "t101",
                            "68": "t102",
                            "69": "t103",
                            "70": "t104"
                        },
                        "c": {
                            "0": [
                            ],
                            "1": [
                            ],
                            "2": [
                            ],
                            "3": [
                            ],
                            "4": [
                            ],
                            "5": [
                            ],
                            "6": [
                            ],
                            "7": [
                            ],
                            "8": [
                            ],
                            "9": [
                            ],
                            "10": [
                            ],
                            "11": [
                            ],
                            "12": [
                            ],
                            "13": [
                            ],
                            "14": [
                            ],
                            "15": [
                            ],
                            "16": [
                            ],
                            "17": [
                            ],
                            "18": [
                            ],
                            "19": [
                            ],
                            "20": [
                            ],
                            "21": [
                            ],
                            "22": [
                            ],
                            "23": [
                            ],
                            "24": [
                            ],
                            "25": [
                            ],
                            "26": [
                            ],
                            "27": [
                            ],
                            "28": [
                            ],
                            "29": [
                            ],
                            "30": [
                            ],
                            "31": [
                            ],
                            "32": [
                            ],
                            "33": [
                            ],
                            "34": [
                            ],
                            "35": [
                            ],
                            "36": [
                            ],
                            "37": [
                            ],
                            "38": [
                            ],
                            "39": [
                            ],
                            "40": [
                            ],
                            "41": [
                            ],
                            "42": [
                            ],
                            "43": [
                            ],
                            "44": [
                            ],
                            "45": [
                            ],
                            "46": [
                            ],
                            "47": [
                            ],
                            "48": [
                            ],
                            "49": [
                            ],
                            "50": [
                            ],
                            "51": [
                            ],
                            "52": [
                            ],
                            "53": [
                            ],
                            "54": [
                            ],
                            "55": [
                            ],
                            "56": [
                            ],
                            "57": [
                            ],
                            "58": [
                            ],
                            "59": [
                            ],
                            "60": [
                            ],
                            "61": [
                            ],
                            "62": [
                                {
                                    "i": "t96",
                                    "r": 3,
                                    "t": {
                                        "0": "t157",
                                        "1": "t158"
                                    },
                                    "c": {
                                        "0": [
                                        ],
                                        "1": [
                                            {
                                                "i": "t157",
                                                "r": 1,
                                                "di": "d4",
                                                "s": 2
                                            }
                                        ]
                                    }
                                }
                            ],
                            "63": [
                            ],
                            "64": [
                            ],
                            "65": [
                            ],
                            "66": [
                            ],
                            "67": [
                            ],
                            "68": [
                            ],
                            "69": [
                            ],
                            "70": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "4": "t166",
                            "6": "t167",
                            "7": "t168",
                            "8": "t171",
                            "9": "t173",
                            "10": "t178",
                            "11": "t184"
                        },
                        "c": {
                            "4": [
                                {
                                    "i": "t166",
                                    "r": 1
                                }
                            ],
                            "6": [
                                {
                                    "i": "t167",
                                    "r": 1
                                }
                            ],
                            "7": [
                                {
                                    "i": "t168",
                                    "r": 1,
                                    "t": {
                                        "2": "t169"
                                    },
                                    "c": {
                                        "2": [
                                            {
                                                "i": "t169",
                                                "r": 1,
                                                "t": {
                                                    "1": "t170"
                                                },
                                                "c": {
                                                    "1": [
                                                        {
                                                            "i": "t170",
                                                            "r": 1
                                                        }
                                                    ]
                                                },
                                                "x": 3
                                            }
                                        ]
                                    }
                                }
                            ],
                            "8": [
                                {
                                    "i": "t171",
                                    "r": 1,
                                    "t": {
                                        "3": "t172"
                                    },
                                    "c": {
                                        "3": [
                                            {
                                                "i": "t172",
                                                "r": 1,
                                                "x": 3
                                            }
                                        ]
                                    }
                                }
                            ],
                            "9": [
                                {
                                    "i": "t173",
                                    "r": 1,
                                    "t": {
                                        "1": "t174",
                                        "3": "t175",
                                        "4": "t176"
                                    },
                                    "c": {
                                        "1": [
                                            {
                                                "i": "t174",
                                                "r": 1
                                            }
                                        ],
                                        "3": [
                                        ],
                                        "4": [
                                            {
                                                "i": "t176",
                                                "r": 1,
                                                "t": {
                                                    "2": "t177"
                                                },
                                                "c": {
                                                    "2": [
                                                        {
                                                            "i": "t177",
                                                            "r": 1,
                                                            "x": 2
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ],
                            "10": [
                                {
                                    "i": "t178",
                                    "r": 1,
                                    "t": {
                                        "3": "t179"
                                    },
                                    "c": {
                                        "3": [
                                            {
                                                "i": "t179",
                                                "r": 1,
                                                "t": {
                                                    "4": "t180",
                                                    "5": "t181",
                                                    "15": "t182",
                                                    "16": "t183"
                                                },
                                                "c": {
                                                    "4": [
                                                    ],
                                                    "5": [
                                                        {
                                                            "i": "t181",
                                                            "r": 1
                                                        }
                                                    ],
                                                    "15": [
                                                        {
                                                            "i": "t182",
                                                            "r": 1
                                                        }
                                                    ],
                                                    "16": [
                                                        {
                                                            "i": "t183",
                                                            "r": 1
                                                        }
                                                    ]
                                                },
                                                "x": 5
                                            }
                                        ]
                                    }
                                }
                            ],
                            "11": [
                                {
                                    "i": "t184",
                                    "r": 1
                                }
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t12",
                            "1": "t13",
                            "2": "t14",
                            "3": "t15",
                            "4": "t16",
                            "5": "t17",
                            "6": "t18",
                            "7": "t19",
                            "8": "t20",
                            "9": "t21",
                            "10": "t22",
                            "11": "t23",
                            "12": "t24",
                            "13": "t25",
                            "14": "t26",
                            "15": "t27",
                            "16": "t28",
                            "17": "t29",
                            "18": "t30",
                            "19": "t31",
                            "20": "t32",
                            "21": "t33",
                            "22": "t34",
                            "23": "t35",
                            "24": "t36",
                            "25": "t37",
                            "26": "t38",
                            "27": "t39",
                            "28": "t40",
                            "29": "t41",
                            "30": "t42",
                            "31": "t43",
                            "32": "t44",
                            "33": "t45",
                            "34": "t46",
                            "35": "t47",
                            "36": "t48",
                            "37": "t49",
                            "38": "t50",
                            "39": "t51",
                            "40": "t52",
                            "41": "t53",
                            "42": "t54",
                            "43": "t55",
                            "44": "t56",
                            "45": "t57",
                            "46": "t58",
                            "47": "t59",
                            "48": "t60",
                            "49": "t61",
                            "50": "t62",
                            "51": "t63",
                            "52": "t64",
                            "53": "t65",
                            "54": "t66",
                            "55": "t67",
                            "56": "t68",
                            "57": "t69",
                            "58": "t70",
                            "59": "t93",
                            "60": "t94",
                            "61": "t95",
                            "62": "t96",
                            "63": "t97",
                            "64": "t98",
                            "65": "t99",
                            "66": "t100",
                            "67": "t101",
                            "68": "t102",
                            "69": "t103",
                            "70": "t104"
                        },
                        "c": {
                            "0": [
                            ],
                            "1": [
                            ],
                            "2": [
                            ],
                            "3": [
                            ],
                            "4": [
                            ],
                            "5": [
                            ],
                            "6": [
                            ],
                            "7": [
                            ],
                            "8": [
                            ],
                            "9": [
                            ],
                            "10": [
                            ],
                            "11": [
                            ],
                            "12": [
                            ],
                            "13": [
                            ],
                            "14": [
                            ],
                            "15": [
                            ],
                            "16": [
                            ],
                            "17": [
                            ],
                            "18": [
                            ],
                            "19": [
                            ],
                            "20": [
                            ],
                            "21": [
                            ],
                            "22": [
                            ],
                            "23": [
                            ],
                            "24": [
                            ],
                            "25": [
                            ],
                            "26": [
                            ],
                            "27": [
                            ],
                            "28": [
                            ],
                            "29": [
                            ],
                            "30": [
                            ],
                            "31": [
                            ],
                            "32": [
                            ],
                            "33": [
                            ],
                            "34": [
                            ],
                            "35": [
                            ],
                            "36": [
                            ],
                            "37": [
                            ],
                            "38": [
                            ],
                            "39": [
                            ],
                            "40": [
                            ],
                            "41": [
                            ],
                            "42": [
                            ],
                            "43": [
                            ],
                            "44": [
                            ],
                            "45": [
                            ],
                            "46": [
                            ],
                            "47": [
                            ],
                            "48": [
                            ],
                            "49": [
                            ],
                            "50": [
                            ],
                            "51": [
                            ],
                            "52": [
                            ],
                            "53": [
                            ],
                            "54": [
                            ],
                            "55": [
                            ],
                            "56": [
                            ],
                            "57": [
                            ],
                            "58": [
                            ],
                            "59": [
                            ],
                            "60": [
                            ],
                            "61": [
                            ],
                            "62": [
                            ],
                            "63": [
                                {
                                    "i": "t97",
                                    "r": 3,
                                    "t": {
                                        "0": "t164",
                                        "1": "t165"
                                    },
                                    "c": {
                                        "0": [
                                        ],
                                        "1": [
                                            {
                                                "i": "t164",
                                                "r": 1,
                                                "di": "d5",
                                                "s": 2
                                            }
                                        ]
                                    }
                                }
                            ],
                            "64": [
                            ],
                            "65": [
                            ],
                            "66": [
                            ],
                            "67": [
                            ],
                            "68": [
                            ],
                            "69": [
                            ],
                            "70": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "5": "t187",
                            "7": "t188",
                            "9": "t189",
                            "10": "t192"
                        },
                        "c": {
                            "5": [
                                {
                                    "i": "t187",
                                    "r": 1
                                }
                            ],
                            "7": [
                                {
                                    "i": "t188",
                                    "r": 1
                                }
                            ],
                            "9": [
                                {
                                    "i": "t189",
                                    "r": 1,
                                    "t": {
                                        "2": "t190"
                                    },
                                    "c": {
                                        "2": [
                                            {
                                                "i": "t190",
                                                "r": 1,
                                                "t": {
                                                    "1": "t191"
                                                },
                                                "c": {
                                                    "1": [
                                                        {
                                                            "i": "t191",
                                                            "r": 1
                                                        }
                                                    ]
                                                },
                                                "x": 3
                                            }
                                        ]
                                    }
                                }
                            ],
                            "10": [
                                {
                                    "i": "t192",
                                    "r": 1,
                                    "t": {
                                        "1": "t193",
                                        "4": "t194",
                                        "5": "t196"
                                    },
                                    "c": {
                                        "1": [
                                            {
                                                "i": "t193",
                                                "r": 1
                                            }
                                        ],
                                        "4": [
                                            {
                                                "i": "t194",
                                                "r": 1,
                                                "t": {
                                                    "1": "t195"
                                                },
                                                "c": {
                                                    "1": [
                                                        {
                                                            "i": "t195",
                                                            "r": 1
                                                        }
                                                    ]
                                                },
                                                "x": 19
                                            }
                                        ],
                                        "5": [
                                            {
                                                "i": "t196",
                                                "r": 1
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t12",
                            "1": "t13",
                            "2": "t14",
                            "3": "t15",
                            "4": "t16",
                            "5": "t17",
                            "6": "t18",
                            "7": "t19",
                            "8": "t20",
                            "9": "t21",
                            "10": "t22",
                            "11": "t23",
                            "12": "t24",
                            "13": "t25",
                            "14": "t26",
                            "15": "t27",
                            "16": "t28",
                            "17": "t29",
                            "18": "t30",
                            "19": "t31",
                            "20": "t32",
                            "21": "t33",
                            "22": "t34",
                            "23": "t35",
                            "24": "t36",
                            "25": "t37",
                            "26": "t38",
                            "27": "t39",
                            "28": "t40",
                            "29": "t41",
                            "30": "t42",
                            "31": "t43",
                            "32": "t44",
                            "33": "t45",
                            "34": "t46",
                            "35": "t47",
                            "36": "t48",
                            "37": "t49",
                            "38": "t50",
                            "39": "t51",
                            "40": "t52",
                            "41": "t53",
                            "42": "t54",
                            "43": "t55",
                            "44": "t56",
                            "45": "t57",
                            "46": "t58",
                            "47": "t59",
                            "48": "t60",
                            "49": "t61",
                            "50": "t62",
                            "51": "t63",
                            "52": "t64",
                            "53": "t65",
                            "54": "t66",
                            "55": "t67",
                            "56": "t68",
                            "57": "t69",
                            "58": "t70",
                            "59": "t93",
                            "60": "t94",
                            "61": "t95",
                            "62": "t96",
                            "63": "t97",
                            "64": "t98",
                            "65": "t99",
                            "66": "t100",
                            "67": "t101",
                            "68": "t102",
                            "69": "t103",
                            "70": "t104"
                        },
                        "c": {
                            "0": [
                            ],
                            "1": [
                            ],
                            "2": [
                            ],
                            "3": [
                            ],
                            "4": [
                            ],
                            "5": [
                            ],
                            "6": [
                            ],
                            "7": [
                            ],
                            "8": [
                            ],
                            "9": [
                            ],
                            "10": [
                            ],
                            "11": [
                            ],
                            "12": [
                            ],
                            "13": [
                            ],
                            "14": [
                            ],
                            "15": [
                            ],
                            "16": [
                            ],
                            "17": [
                            ],
                            "18": [
                            ],
                            "19": [
                            ],
                            "20": [
                            ],
                            "21": [
                            ],
                            "22": [
                            ],
                            "23": [
                            ],
                            "24": [
                            ],
                            "25": [
                            ],
                            "26": [
                            ],
                            "27": [
                            ],
                            "28": [
                            ],
                            "29": [
                            ],
                            "30": [
                            ],
                            "31": [
                            ],
                            "32": [
                            ],
                            "33": [
                            ],
                            "34": [
                            ],
                            "35": [
                            ],
                            "36": [
                            ],
                            "37": [
                            ],
                            "38": [
                            ],
                            "39": [
                            ],
                            "40": [
                            ],
                            "41": [
                            ],
                            "42": [
                            ],
                            "43": [
                            ],
                            "44": [
                            ],
                            "45": [
                            ],
                            "46": [
                            ],
                            "47": [
                            ],
                            "48": [
                            ],
                            "49": [
                            ],
                            "50": [
                            ],
                            "51": [
                            ],
                            "52": [
                            ],
                            "53": [
                            ],
                            "54": [
                            ],
                            "55": [
                            ],
                            "56": [
                            ],
                            "57": [
                            ],
                            "58": [
                            ],
                            "59": [
                            ],
                            "60": [
                            ],
                            "61": [
                            ],
                            "62": [
                            ],
                            "63": [
                            ],
                            "64": [
                            ],
                            "65": [
                                {
                                    "i": "t99",
                                    "r": 3,
                                    "t": {
                                        "0": "t185",
                                        "1": "t186"
                                    },
                                    "c": {
                                        "0": [
                                        ],
                                        "1": [
                                            {
                                                "i": "t185",
                                                "r": 1,
                                                "di": "d6",
                                                "s": 2
                                            }
                                        ]
                                    }
                                }
                            ],
                            "66": [
                            ],
                            "67": [
                            ],
                            "68": [
                            ],
                            "69": [
                            ],
                            "70": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "3": "t199",
                            "5": "t200",
                            "7": "t201",
                            "8": "t202",
                            "9": "t203"
                        },
                        "c": {
                            "3": [
                                {
                                    "i": "t199",
                                    "r": 1
                                }
                            ],
                            "5": [
                                {
                                    "i": "t200",
                                    "r": 1
                                }
                            ],
                            "7": [
                                {
                                    "i": "t201",
                                    "r": 1
                                }
                            ],
                            "8": [
                                {
                                    "i": "t202",
                                    "r": 1
                                }
                            ],
                            "9": [
                                {
                                    "i": "t203",
                                    "r": 1,
                                    "t": {
                                        "2": "t204"
                                    },
                                    "c": {
                                        "2": [
                                            {
                                                "i": "t204",
                                                "r": 1,
                                                "x": 4
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t12",
                            "1": "t13",
                            "2": "t14",
                            "3": "t15",
                            "4": "t16",
                            "5": "t17",
                            "6": "t18",
                            "7": "t19",
                            "8": "t20",
                            "9": "t21",
                            "10": "t22",
                            "11": "t23",
                            "12": "t24",
                            "13": "t25",
                            "14": "t26",
                            "15": "t27",
                            "16": "t28",
                            "17": "t29",
                            "18": "t30",
                            "19": "t31",
                            "20": "t32",
                            "21": "t33",
                            "22": "t34",
                            "23": "t35",
                            "24": "t36",
                            "25": "t37",
                            "26": "t38",
                            "27": "t39",
                            "28": "t40",
                            "29": "t41",
                            "30": "t42",
                            "31": "t43",
                            "32": "t44",
                            "33": "t45",
                            "34": "t46",
                            "35": "t47",
                            "36": "t48",
                            "37": "t49",
                            "38": "t50",
                            "39": "t51",
                            "40": "t52",
                            "41": "t53",
                            "42": "t54",
                            "43": "t55",
                            "44": "t56",
                            "45": "t57",
                            "46": "t58",
                            "47": "t59",
                            "48": "t60",
                            "49": "t61",
                            "50": "t62",
                            "51": "t63",
                            "52": "t64",
                            "53": "t65",
                            "54": "t66",
                            "55": "t67",
                            "56": "t68",
                            "57": "t69",
                            "58": "t70",
                            "59": "t93",
                            "60": "t94",
                            "61": "t95",
                            "62": "t96",
                            "63": "t97",
                            "64": "t98",
                            "65": "t99",
                            "66": "t100",
                            "67": "t101",
                            "68": "t102",
                            "69": "t103",
                            "70": "t104"
                        },
                        "c": {
                            "0": [
                            ],
                            "1": [
                            ],
                            "2": [
                            ],
                            "3": [
                            ],
                            "4": [
                            ],
                            "5": [
                            ],
                            "6": [
                            ],
                            "7": [
                            ],
                            "8": [
                            ],
                            "9": [
                            ],
                            "10": [
                            ],
                            "11": [
                            ],
                            "12": [
                            ],
                            "13": [
                            ],
                            "14": [
                            ],
                            "15": [
                            ],
                            "16": [
                            ],
                            "17": [
                            ],
                            "18": [
                            ],
                            "19": [
                            ],
                            "20": [
                            ],
                            "21": [
                            ],
                            "22": [
                            ],
                            "23": [
                            ],
                            "24": [
                            ],
                            "25": [
                            ],
                            "26": [
                            ],
                            "27": [
                            ],
                            "28": [
                            ],
                            "29": [
                            ],
                            "30": [
                            ],
                            "31": [
                            ],
                            "32": [
                            ],
                            "33": [
                            ],
                            "34": [
                            ],
                            "35": [
                            ],
                            "36": [
                            ],
                            "37": [
                            ],
                            "38": [
                            ],
                            "39": [
                            ],
                            "40": [
                            ],
                            "41": [
                            ],
                            "42": [
                            ],
                            "43": [
                            ],
                            "44": [
                            ],
                            "45": [
                            ],
                            "46": [
                            ],
                            "47": [
                            ],
                            "48": [
                            ],
                            "49": [
                            ],
                            "50": [
                            ],
                            "51": [
                            ],
                            "52": [
                            ],
                            "53": [
                            ],
                            "54": [
                            ],
                            "55": [
                            ],
                            "56": [
                            ],
                            "57": [
                            ],
                            "58": [
                            ],
                            "59": [
                            ],
                            "60": [
                            ],
                            "61": [
                            ],
                            "62": [
                            ],
                            "63": [
                            ],
                            "64": [
                            ],
                            "65": [
                            ],
                            "66": [
                                {
                                    "i": "t100",
                                    "r": 3,
                                    "t": {
                                        "0": "t197",
                                        "1": "t198"
                                    },
                                    "c": {
                                        "0": [
                                        ],
                                        "1": [
                                            {
                                                "i": "t197",
                                                "r": 1,
                                                "di": "d7",
                                                "s": 2
                                            }
                                        ]
                                    }
                                }
                            ],
                            "67": [
                            ],
                            "68": [
                            ],
                            "69": [
                            ],
                            "70": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "1": "t9",
                            "2": "t10"
                        },
                        "c": {
                            "1": [
                            ],
                            "2": [
                                {
                                    "i": "t10",
                                    "r": 10,
                                    "t": {
                                        "1": "t11"
                                    },
                                    "c": {
                                        "1": [
                                            {
                                                "i": "t11",
                                                "r": 1,
                                                "x": 9
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "c": {
                            "0": [
                            ],
                            "7": [
                            ]
                        },
                        "t": {
                            "7": "t207"
                        }
                    },
                    {
                        "t": {
                            "0": "t205",
                            "1": "t208"
                        },
                        "c": {
                            "0": [
                                {
                                    "i": "t205",
                                    "r": 1,
                                    "t": {
                                        "88": "t206"
                                    },
                                    "c": {
                                        "88": [
                                        ]
                                    }
                                }
                            ],
                            "1": [
                            ]
                        }
                    },
                    {
                        "t": {
                            "0": "t0",
                            "2": "t1",
                            "5": "t4"
                        },
                        "c": {
                            "0": [
                            ],
                            "2": [
                                {
                                    "i": "t1",
                                    "r": 1
                                }
                            ],
                            "5": [
                                {
                                    "i": "t4",
                                    "r": 1,
                                    "t": {
                                        "4": "t5",
                                        "5": "t6"
                                    },
                                    "c": {
                                        "4": [
                                        ],
                                        "5": [
                                            {
                                                "i": "t6",
                                                "r": 1
                                            }
                                        ]
                                    }
                                }
                            ],
                            "11": [
                                {
                                    "i": "c3822806064",
                                    "r": 1
                                }
                            ]
                        },
                        "n": {
                            "5": "4f",
                            "7": "6f"
                        }
                    }
                ],
                "__nghDeferData__": {
                    "d0": {
                        "r": 1,
                        "s": 2,
                        "t": [
                            2
                        ]
                    },
                    "d1": {
                        "r": 1,
                        "s": 2,
                        "t": [
                            2
                        ]
                    },
                    "d2": {
                        "r": 1,
                        "s": 2,
                        "t": [
                            2
                        ]
                    },
                    "d3": {
                        "r": 1,
                        "s": 2,
                        "t": [
                            2
                        ]
                    },
                    "d4": {
                        "r": 1,
                        "s": 2,
                        "t": [
                            2
                        ]
                    },
                    "d5": {
                        "r": 1,
                        "s": 2,
                        "t": [
                            2
                        ]
                    },
                    "d6": {
                        "r": 1,
                        "s": 2,
                        "t": [
                            2
                        ]
                    },
                    "d7": {
                        "r": 1,
                        "s": 2,
                        "t": [
                            2
                        ]
                    }
                }
            }</script>
        <script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/v4513226cdae34746b4dedf0b4dfa099e1781791509496" integrity="sha512-ZE9pZaUXND66v380QUtch/5sE9tPFh2zg45pR2PB0CVkCtOREv2AJKkSidISWkysEuQ0EH8faUU5du78bx87UQ==" data-cf-beacon='{"version":"2024.11.0","token":"7757a20d65bf490c841b117c2a9dc9a0"}' crossorigin="anonymous"></script>
    </body>
</html>
