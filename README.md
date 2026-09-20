# Serg to Eunan calculator

Turns a kilogram lifting target into the pound plates to load on the bar.
Type the kilograms your coach programmed, and the page draws the bar with the exact plates, shows the loaded weight in pounds and kilograms, and lists the plates per side.

## Settings

Open the cog in the top right.

- Include bar weight: on by default.
  The bar's own weight counts toward the target, so the total shown is bar plus plates.
- Round to: closest over (default) or closest under, using the plates in the gym.
- Bar: barbell (45 lb) or curl bar (25 lb).
- Theme: dark (default) or light.

Settings are remembered on the device between visits until you change them.
Clear bar clears the number and the bar but keeps the settings.

## Plates

The gym has 45 lb (blue), 35 lb (yellow), 25 lb (green), 15 lb (black) and 10 lb (white) plates.
The inventory lives in `src/lib/plates.ts`; adding a plate is one line there.

## Development

```bash
npm install
npm run dev      # local server
npm run check    # typecheck, tests, production build
```

## Deployment

Every push to `main` builds and deploys to GitHub Pages through `.github/workflows/deploy.yml`.

One-time setup:

1. Create the `Eunanibus/lifting-calculator` repository on GitHub.
2. In the repository settings, under Pages, set Build and deployment to GitHub Actions.
   Until this is done every workflow run fails at the configure-pages step.
3. Push:

   ```bash
   git remote add origin git@github.com:Eunanibus/lifting-calculator.git
   git push -u origin main
   ```

The site is then served at `https://eunanibus.github.io/lifting-calculator/`.
