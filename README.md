# SWL Squad Training 2.0

A static gymnastics training app with four views: Leaderboards, Skills, Gymnasts, and Games, plus a focused Analytics page. The Skill League tracker connects to the shared Google Sheet, with instant skill cycling, gymnast creation, undo, and recovery of unsaved edits. The two games run independently on the current device.

After the opening screen, the main page goes directly to the leaderboards, with a small Scoring guide button. Squad filters switch every board between All squads, Dan’s senior squad, Marx’s senior squad and Marx’s floor and vault. Each board shows the top five and a softly blurred sixth-place preview; selecting a gymnast opens their skills. The podium medals gleam in a staggered gold, silver, then bronze sequence.

Completing all three skills at Perfect in any Rolls or Acro complex, or all three leaps, starts a green-and-gold confetti overlay, a result card, and a victory sound. The page stays still and interactive while the overlay animates, and background saving continues. New Achieved and Perfect marks use very high bell tones, while completion adds soft complementary high harmonies. The app respects the device’s reduced-motion setting; reduced motion shows a static result card without confetti. The Sound control remains available for each device. The former Data and Motion controls are no longer in the interface.

Basics and leaps earn 10 points per achieved skill, upgrades 5, and pro upgrades 2.5. Perfect doubles each skill value. Existing marks are retained and totals use these values, including fractional points. Linking and presentation earn a separate Good / Excellent / Perfect bonus of 1 / 2 / 3 points for each of the six non-leap complexes. Linking bonuses are not doubled.

Each three-skill Rolls or Acro complex, and the three-leap collection, also earns an automatic completion bonus: 5 points when all three skills are at least Achieved, or 10 when all three are Perfect. The 10-point bonus replaces the 5-point bonus. A mix of Achieved and Perfect earns 5; lowering or clearing a mark recalculates the bonus immediately. Completion bonuses are derived from the existing marks and require no separate saved field.

The maximum is 358 points: 270 for skills, 18 for linking, and 70 for completing all seven groups at Perfect. Category maxima are Rolls 144, Acro 144, and Leaps 70.

Each gymnast profile shows their placement in Overall, Rolls, Acro and Leaps, with up to two clear neighboring gymnasts above and below and an obscured third preview on each side. The fixed window keeps the selected gymnast in place at the top and bottom of a board. Rankings use points descending, then names alphabetically to resolve equal scores.

## First visit

A personal welcome note from Marx explains the app as a small experiment alongside normal squad training: tracking foundational floor skills, celebrating progress and adding friendly competition within each squad. It appears after the startup screen on the first visit in a browser. Dismissing it is remembered on that device/browser; About this app in the footer opens it again. It stores no personal information.

The leaderboard’s Analytics button always opens All squads and All gymnasts. Personal Progress insights still opens the selected gymnast.

## Skill renewal and insights

Each achieved or perfect skill lasts 30 days at its current level. At expiry it drops one level; after another 30 days without renewal, Achieved becomes unticked. Automatic expiry still applies while scoring is locked. Existing marks begin a fresh 30-day period at migration, preserving all launch scores. Renew keeps the current level and resets the timer; it requires unlocked scoring. Undo restores the previous mark as a manual reassessment: any retained level gets a fresh 30-day timer, and the undone gain does not count toward On fire. Skills with seven days or less remaining turn red and appear in the Unticked + due for renewal list.

Google Sheets stores server-authoritative renewal and latest-gain dates. A gymnast is On fire after gains on three distinct, currently retained skills in the last seven days. Renewals do not count. Historical gains before version 2 are not invented.

The searchable Gymnasts directory groups every gymnast by squad. Analytics shows retained and perfect skills, category completion, renewal deadlines, recent gains, squad comparisons and a skill map, scoped to all squads, a squad or one gymnast. It uses current marks and their latest dates, rather than claiming a complete historical event log. Placement profiles default to their own squad with an All squads switch.

## Squad games

Games remain available while league scoring is locked. Game points and optional team names stay in the current page session; they are not saved to Google Sheets and never change Skill League marks or totals. Returning to another app view preserves the session, while reloading the page starts fresh.

- **Conditioning wheel:** start a game in Conditioning or Crazy mode, then spin and complete the task. The coach chooses Good to remove the landed exercise, Okay to halve its remaining reps or time (rounded up, minimum one), or Needs work to add another conditioning exercise. Special turns have a Done button. At one remaining option the game is complete. Each mode keeps its own progress until a new game or reload. Leaving mid-spin cancels the spin without grading it. Tap any segment or its full-name list button to see the instructions. Short labels keep the wheel readable as its segment count changes. Crazy mode spins faster, with harder conditioning, a funniest-pose spinner choice, a rare all-coaches splits challenge, and five minutes of supervised free time. The old coach dance and victory-pose tasks are removed. New game asks before clearing an active game.
- **Team Challenge:** choose two to four teams with optional names, then rotate through five turns per team. Each turn draws one of 66 floor-only challenges across six categories. Used cards are remembered on the device across sessions, with no repeats until the deck is exhausted. Consecutive categories are varied where possible. Read the card, then press Go for ten seconds: the first seven seconds are silent, the last three have tones, and the finish has a short chime. The coach awards one, two, or three stars; the timer never awards points. Each team can earn up to 15 stars, and tied leaders share the win. Awards can be undone before advancing. Leaving a timed round pauses it until Resume. New game asks before clearing the session.

Both games follow the Sound control and the device’s reduced-motion preference.

## Publish with GitHub Pages

1. Set `appsScriptUrl` in `config.js` to the public Google Apps Script web-app `/exec` URL.
2. Keep these files together at the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**, the publishing branch, and **/ (root)**.
4. Open the published Pages address. Relative asset paths support a repository subpath or custom domain.

No build step, package installation, or Actions workflow is required. `.nojekyll` lets Pages serve the files directly.

## Google Sheets connection

The Apps Script deployment must accept the public `swl-pages-v1` protocol and have access to the league’s Google Sheet. The browser sends ordinary text requests to that deployment and reads its JSON response. `config.js` contains only the public endpoint URL; visitors do not need a Google or website-owner login.

The scoring lock is shared by everyone. Locking takes effect at the server immediately and blocks new scoring changes for all visitors. A four-digit keypad sends an unlock request to Google Apps Script, which checks the code on the server. A successful unlock opens editing for everyone until someone locks it again. The shared lock state is stored in the Google Sheet’s Meta tab. Leaderboards and gymnast profiles remain browsable while locked.

Keep the Google Sheet publicly viewable, with public access set to **Viewer**, so direct Sheet edits cannot bypass the scoring lock. The owner and Apps Script retain edit access. The unlock code is not published in this README or the website’s public files.

While unlocked, anyone with the website link can edit scores. Changes appear immediately and save in the background. If saving fails, the page retains the edits and displays **Retry save**. Wait for **All changes saved to Google Sheets** before closing.

For local checking, serve this folder using any static HTTP server. The website has no hosting-specific runtime dependency; Google Apps Script provides the shared data connection.

SWL marking guide: Achieved means the intended skill would count without downgrade and has at most 0.5 deductions. Perfect allows at most 0.2 deductions and requires the correct skill shape. Linking ratings assess transitions, balance and presentation independently of skill marks. Ratings save to the separate Linking tab in the same Sheet and are included in unsaved-edit recovery and undo.
