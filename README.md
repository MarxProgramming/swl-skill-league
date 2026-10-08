# SWL Skill League

A static gymnastics tracker connected to the shared Google Sheet. It includes the SWL design, animated podium, instant skill cycling, gymnast creation, undo, backups, and recovery of unsaved edits.

The opening screen animates while scores load, then reveals the league. Completing all three skills at Perfect in a Rolls or Acro base, upgraded, or pro upgraded complex starts a short whole-app celebration and victory sound. Scoring and background saving stay available throughout. The Motion and Sound controls let each device choose its preferred experience.

Basics and leaps earn 10 points per achieved skill, upgrades 5, and pro upgrades 2.5. Perfect doubles each value. Existing marks are retained and totals use these values, including fractional points. The maximum is 270 points; a perfect base complex earns 60, an upgraded complex 30, and a pro complex 15.

## Publish with GitHub Pages

1. Set `appsScriptUrl` in `config.js` to the public Google Apps Script web-app `/exec` URL.
2. Keep these files together at the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**, the publishing branch, and **/ (root)**.
4. Open the published Pages address. Relative asset paths support a repository subpath or custom domain.

No build step, package installation, or Actions workflow is required. `.nojekyll` lets Pages serve the files directly.

## Google Sheets connection

The Apps Script deployment must accept the public `swl-pages-v1` protocol and have access to the league’s Google Sheet. The browser sends ordinary text requests to that deployment and reads its JSON response. `config.js` contains only the public endpoint URL; the website does not require a login or credentials.

Anyone with the website link can edit scores. Changes appear immediately and save in the background. If saving fails, the page retains the edits and displays **Retry save**. Wait for **All changes saved to Google Sheets** before closing, or export a backup.

For local checking, serve this folder using any static HTTP server. The website has no hosting-specific runtime dependency; Google Apps Script provides the shared data connection.
