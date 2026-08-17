FEDERAL MOTION — ALPHA 0.2 RELEASE

WHAT'S IN THIS BUILD
- Supabase anonymous player IDs
- Local + cloud saves
- Shared Motion Tax owner bank
- Public-safe online leaderboard foundation
- Dynamic job colors: Green / Yellow / Red / Black
- All robberies require weapons; bigger jobs require higher weapon tiers
- Faster early leveling, slower long-term climb
- Open-ended progression; Federal Motion is a status, not an ending
- Titles/stages based on level + respect + net worth
- Objectives
- Achievements
- Six natural skills
- Lay Low heat reduction
- Heat consequences
- Burner phone UI + 4 phone tiers
- Multiple vehicles and active vehicle selection
- Multiple properties
- Patch Notes and How To Play

BEFORE UPLOADING TO GITHUB PAGES
1. In Supabase SQL Editor, run Alpha02-Database-Update.sql.
2. Test index.html locally.
3. Confirm the top says "Alpha 0.2 · CLOUD ONLINE".
4. Make one purchase with a non-zero Motion Tax.
5. Confirm fm_owner_bank increases.
6. Upload index.html, app.js, styles.css, README.txt to the FederalMotion-Web GitHub repo.

SECURITY
The key in app.js is a Supabase publishable/browser key.
Never put a Supabase secret key or service_role key in these web files.
