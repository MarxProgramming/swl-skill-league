# SWL Squad Training 2.0

A static gymnastics training app with three main views: Leaderboards, Gymnasts and Games, plus focused Analytics and All skills pages. The Skill League tracker connects to the shared Google Sheet, with instant skill cycling, gymnast creation, undo, and recovery of unsaved edits. The eight games run independently on the current device, with anonymous game ratings saved to Google Sheets.

After the opening screen, the main page goes directly to the leaderboards, with a small Scoring guide button. Squad filters switch every board between All squads, All senior squad (Marx and Dan together), Dan’s senior squad, Marx’s senior squad and Marx’s floor and vault. Each board shows the top five and a softly blurred sixth-place preview; selecting a gymnast opens their skills. The podium medals gleam in a staggered gold, silver, then bronze sequence.

Completing all three skills at Perfect in any Rolls or Acro complex, or all three leaps, starts a green-and-gold confetti overlay, a result card, and a victory sound. The page stays still and interactive while the overlay animates, and background saving continues. New Achieved and Perfect marks use very high bell tones, while completion adds soft complementary high harmonies. The app respects the device’s reduced-motion setting; reduced motion shows a static result card without confetti. The Sound control remains available for each device. The former Data and Motion controls are no longer in the interface.

Basics and leaps earn 10 points per achieved skill, upgrades 5, and pro upgrades 2.5. Perfect doubles each skill value. Existing marks are retained and totals use these values, including fractional points. Linking and presentation earn a separate Good / Excellent / Perfect bonus of 1 / 2 / 3 points for each of the six non-leap complexes. Linking bonuses are not doubled.

Each three-skill Rolls or Acro complex, and the three-leap collection, also earns an automatic completion bonus: 1 point when all three skills are at least Achieved, or 5 when all three are Perfect. The 5-point bonus replaces the 1-point bonus. A mix of Achieved and Perfect earns 1; lowering or clearing a mark recalculates the bonus immediately. Completion bonuses are derived from the existing marks and require no separate saved field.

The maximum is 323 points: 270 for skills, 18 for linking, and 35 for completing all seven groups at Perfect. Category maxima are Rolls 129, Acro 129, and Leaps 65. Existing gymnasts are recalculated immediately from unchanged skill marks; no score migration or additional award is saved.

Each gymnast profile shows their placement in Overall, Rolls, Acro and Leaps, with up to two clear neighboring gymnasts above and below and an obscured third preview on each side. The fixed window keeps the selected gymnast in place at the top and bottom of a board. Rankings use points descending, then names alphabetically to resolve equal scores.

## Version 2.5

Team Skill Draft is a separate game for two or three equal-sized teams. Shuffle one shared skill, let each team choose an unused gymnast, and award one point to the best attempt. Every performer uses a turn; play ends when everyone has had one go. Anonymous class ratings and completed plays use the same Google Sheets tracking as the other games. The wheel uses conditioning in place of the former funny/silly entries.

Leaderboards have matching squad and age dropdowns, including Hannah’s floor and vault. Nine additional gymnasts are stored in the shared roster; dates of birth stay in private Apps Script properties and only competition age/category reaches the public app.

Heat uses net points over the last seven London calendar days: 10 for Hot and 15 for On fire. Earned heat lasts seven days; removing unearned points reverses it. Analytics shows eight weekly windows of signed net points, with untracked periods marked clearly. Automatic skill expiry does not subtract momentum. The tracking ledger starts with available recorded progress rather than inventing earlier activity.

First confirmed score milestones at 200 and 250 points earn a prize celebration. Durable milestone records prevent repeat awards after refresh, retry or later score reductions. Existing qualifying totals are registered quietly at migration. Perfect-complex celebrations finish before a queued prize appears.

Unchanged refreshes retain leaderboard, directory, analytics and game-card elements. Changed analytics content preserves its open legend, map scroll and focused control. Manual scoring locks still have no timer.

## First visit

A personal welcome note from Marx explains the app as a small experiment alongside normal squad training: tracking foundational floor skills, celebrating progress and adding friendly competition within each squad. It appears after the startup screen on the first visit in a browser. Dismissing it is remembered on that device/browser; About this app in the footer opens it again. It stores no personal information.

The leaderboard’s Analytics button always opens All squads and All gymnasts. Personal Progress insights still opens the selected gymnast.

## Skill renewal and insights

Each achieved or perfect skill lasts 30 days at its current level. At expiry it drops one level; after another 30 days without renewal, Achieved becomes unticked. Automatic expiry still applies. Existing marks begin a fresh 30-day period at migration, preserving all launch scores. Renew keeps the current level and resets the timer; it saves in the same way as other marks. Undo restores the previous mark as a manual reassessment: any retained level gets a fresh 30-day timer, and undo reduces today’s net points. Skills with seven days or less remaining turn red and appear in the Unticked + due for renewal list.

Google Sheets stores server-authoritative renewal and latest-gain dates, plus each London day’s net league points. Hot starts at 10 points and On fire at 15. All skill points, linking ratings and the +1/+5 completion bonuses count. Renewals add no points, while manual reductions and undo reduce the net total. Automatic expiry is excluded from today’s gains and losses. Pending edits update the highlights immediately; a save acknowledgement replaces the baseline without counting an edit twice. Highlights reset at the London calendar boundary and wait for current-day data if the page is offline. The first tracking day counts only progress since tracking began; earlier points are never guessed. Filters do not change the thresholds.

Leaderboard Age and squad filters combine, with counts for each selection and a clear empty state. Analytics uses the same age categories. The official [IGA January 2026 Women’s Artistic National Pathway handbook, printed page 5](https://www.independentgymnastics.com/wp-content/uploads/2022/10/UPDATED-WAG-National-Pathway-Handbook-Information_compressed.pdf#page=6) defines age as the age a gymnast turns in the current calendar year: Mini Marvels 5–6, Little Leapers 7–8, Skill Seekers 9–10, Trailblazers 11–12, Pioneers 13–14, Legends 15–16 and Masters 17+. The current year follows London time. Public roster data contains only competition age, category and year; no dates of birth or email addresses are sent to the website. Missing age information, ages below five, and a cached previous-year category appear under No current age category until fresh information is loaded.

The searchable Gymnasts directory groups every gymnast by squad. Analytics shows retained and perfect skills, category completion, renewal deadlines, recent gains, squad comparisons and a skill map, scoped to all squads, a squad or one gymnast. It uses current marks and their latest dates, rather than claiming a complete historical event log. Placement profiles default to their own squad with an All squads switch.

## Squad games

Games are always available. Game points and optional team names stay in the current page session; they are not saved to Google Sheets and never change Skill League marks or totals. Returning to another app view preserves the session, while reloading the page starts fresh.

- **Conditioning wheel:** start a game in Conditioning or Crazy mode, then spin and complete the task. The coach chooses Good to remove the landed exercise, Okay to halve its remaining reps or time (rounded up, minimum one), or Needs work to add another conditioning exercise. Special turns have a Done button. At one remaining option the game is complete. Each mode keeps its own progress until a new game or reload. Leaving mid-spin cancels the spin without grading it. Tap any segment or its full-name list button to see the instructions. Short labels keep the wheel readable as its segment count changes. Crazy mode spins faster, with harder conditioning, a funniest-pose next spin, a rare all-coaches splits challenge, and five minutes of supervised free time. The old coach dance and victory-pose tasks are removed. New game asks before clearing an active game.
- **Team Challenge:** choose two to four teams with optional names, then rotate through four turns per team. The 46-card deck spans eight categories and keeps floor shapes, jumps to stick together and balances, includes seven conditioning rep challenges and three coaching reenactments (Marx, Dan and Isabella), and removes the requested copy-shape, lunge, partner-pike and roll cards. V sit uses its familiar name. Used cards are remembered on the device across sessions, with no repeats until the deck is exhausted. Consecutive categories are varied where possible. Read the card, then press Go for ten seconds: the first seven seconds are silent, the last three have tones, and the finish has a short chime. The coach awards one, two, or three stars; the timer never awards points. Each team can earn up to 12 stars, and tied leaders share the win. Awards can be undone before advancing. Leaving a timed round pauses it until Resume. New game asks before clearing the session.
- **Skill Shuffle:** choose two or three teams and enter 1–20 gymnasts for each. Teams alternate while they have gymnasts left, and everyone gets one attempt. The next gymnast performs a randomly revealed skill from the app’s complete 21-skill catalogue. Coach rates it from left to right: 1 star attempt does not count, 2 completed but messy, 3 nearly perfect. Coach can redraw an unsuitable skill before grading. The board shows average stars per gymnast alongside total stars so unequal teams can compete fairly; the exact average determines the winner. Undo is available before moving to the next gymnast. Replay keeps team names and sizes.
- **Letter Duel:** a large random letter appears, drawn from 13 useful letters beginning app skills and familiar floor skills or shapes. Coach awards one point to either team for a valid gymnastics skill beginning with it, or skips the letter. Optional hints show matching app skills and familiar floor examples. First to seven wins; letters do not repeat until the current pool is used.
- **Handstand Timer:** Individual mode keeps the original two or three teams, 1–20 gymnasts each. Start and stop each hold, review, then confirm; Pro mode allows Fell over (zero seconds) or Extra neat (+1 second). Group mode times the whole team until the last gymnast comes down; that gymnast sits out future rounds. Choose 1–10 rounds (two by default); teams take turns until their rounds or gymnasts are used. Highest total seconds wins. Undo restores time and the gymnast count.
- **Add-On:** two or three teams, 1–20 gymnasts each. Each team starts its own chain with one skill. Later gymnasts choose one of three shuffled options, append it and perform the growing routine. Rate the complete routine 1, 2 or 3 stars. Highest average stars per gymnast wins; totals remain visible. Coach can redraw choices and undo the current award.
- **Conditioning Relay:** time the whole team through a chosen exercise. Tap each gymnast’s handover to record a split and finish after the final gymnast. Review any missed-rep penalties (+2 seconds each), then confirm. Lowest average seconds per gymnast wins, keeping unequal teams comparable. Splits and totals stay visible; a team can redo its relay.
- **Time Sense:** each gymnast holds a familiar balance and estimates an 8–15 second target without seeing or hearing a clock. Coach starts and stops it. The score is 10 minus the absolute timing error in seconds, with a minimum of zero. Balance lost makes the attempt zero. Highest average points per gymnast wins.

Skill Shuffle uses a four-second horizontal card reel with a fixed centre marker, card-by-card ticks and a bright final reveal. Starting a game centres a compact play screen with the reel, team scores, stars and next-gymnast controls kept inside the viewport, including on phones and iPads. It pauses on navigation and continues only on Resume. Time Sense deliberately has no timing sounds or moving clock during an attempt.

After a completed game, the winner stays visible before a rating prompt appears. Choose one anonymous class score from 1–10 and save it. Rate buttons on each game card and inside each game also allow voting without playing. The separate GameRatings sheet stores submissions without gymnast names; previous ratings remain part of the running average. Finish later keeps the draft on this device. Saving continues in the background, and saved submissions can safely retry without counting twice.

Each completed game is recorded independently in the GamePlays sheet, even if its rating is skipped. Submitting a manual class rating also records one play. A rating after completion uses the same play receipt, so the game counts once. Repeated saves are deduplicated. Cards and game headers show the average rating and play count. Choose Hottest to sort by average rating or Most played to sort by plays. The highest-rated game has a fiery Hottest game badge; equal averages favour the game with more votes. Both rating and play tracking recover unsent submissions after going offline. Play tracking starts with this update; earlier completions are not estimated from votes.

Routine Relay, Stick & Bank and Hold the Line are no longer offered in the app.

All eight games follow the Sound control and the device’s reduced-motion preference. Game cues have stronger, longer countdown tones, a distinct two-tone finish, an audible spin start and clearer wheel ticks. Skill-mark bells keep their existing mix. Device volume still controls speaker output.

Challenge design draws on [British Gymnastics’ Partner School session plans](https://a.storyblok.com/f/83342/x/d431c09726/09_2021_session-plans-1-24-final.pdf), [Oak National Academy’s sequence lessons](https://www.thenational.academy/teachers/programmes/physical-education-primary-ks2/units/gymnastics-movements-balances-and-sequence-composition/lessons/sequence-formation-combining-individual-and-pair-balances), and [Seascale’s gymnastics sequences](https://www.seascaleschool.co.uk/gym-sequences/). The app’s challenge wording and game formats are original adaptations, not official programmes or endorsements.

## Publish with GitHub Pages

1. Set `appsScriptUrl` in `config.js` to the public Google Apps Script web-app `/exec` URL.
2. Keep these files together at the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**, the publishing branch, and **/ (root)**.
4. Open the published Pages address. Relative asset paths support a repository subpath or custom domain.

No build step, package installation, or Actions workflow is required. `.nojekyll` lets Pages serve the files directly.

## Google Sheets connection

The Apps Script deployment must accept the public `swl-pages-v1` protocol and have access to the league’s Google Sheet. The browser sends ordinary text requests to that deployment and reads its JSON response. `config.js` contains only the public endpoint URL; visitors do not need a Google or website-owner login.

Scoring has a shared manual lock. Lock scoring pauses score changes for everyone; the existing PIN unlocks it. There is no automatic timer: either state persists until explicitly changed. Profiles, leaderboards and games remain available. Access checks run every 30 seconds and retain the last confirmed state during transient failures; the backend enforces the lock on every save. The faster data loading and safe retry behaviour are retained.

Keep the Google Sheet publicly viewable with public access set to **Viewer**; the owner and Apps Script retain edit access. Changes appear immediately and save in the background. If saving fails, the page retains the edits and displays **Retry save**. Wait for **All changes saved to Google Sheets** before closing.

The opening screen can be dismissed after a short pause and automatically opens training within six seconds, even if Google Sheets is still loading. Scores show an honest loading or retry state until the connection succeeds. A request has a bounded timeout; failed requests never erase valid loaded scores or unsaved edits.

For local checking, serve this folder using any static HTTP server. The website has no hosting-specific runtime dependency; Google Apps Script provides the shared data connection.

SWL marking guide: Achieved means the intended skill would count without downgrade and has at most 0.5 deductions. Perfect allows at most 0.2 deductions and requires the correct skill shape. Linking ratings assess transitions, balance and presentation independently of skill marks. Ratings save to the separate Linking tab in the same Sheet and are included in unsaved-edit recovery and undo.

The Gymnasts directory offers an optional Add a complex selector. One selected three-skill group appears under every visible name, with abbreviated labels, full accessible names and due-renewal buttons. Marks use the same instant updates, background saves and undo as the full gymnast profile. Achieved marks are purple with one tick; Perfect marks are mint with two ticks. Clearing the selector returns to names only. Opening a gymnast keeps Gymnasts selected; Back to gymnasts restores the directory search, squad, complex and scroll position. The existing Add gymnast form is available in the directory.

Retry saving is always available in the footer. It reconnects if needed and retries pending league edits, game ratings and play counts while preserving unsaved work.

## Skill catalogue and IGA reference

The subtle All skills header button opens a read-only catalogue of all seven complexes and 21 skills, including the existing skill points and completion bonuses. It never assigns or changes gymnast marks. Filters narrow the catalogue by category, and Back restores the previous view.

Seventeen clear floor-skill matches show difficulty letters from the official [IGA 2026 Women’s Artistic Code of Points](https://www.independentgymnastics.com/wp-content/uploads/2022/10/UPDATED-WAG-CODE-OF-POINTS-2026.pdf#page=9). These A–G letters are separate from competition levels or Gems grades. Unspecified combinations, the half-turn jump and the unspecified front somersault are left ungraded. Handstand roll to pike stand is identified as Regional pathway only. Qualifications for straight jumps, turns on one foot and change-leg leaps remain visible without information pop-ups.

## Save recovery audit

Each scoring tab owns a separate recovery record, so an idle tab cannot erase another tab’s pending edits. Browser Web Locks coordinate recovery of abandoned tabs; older browsers preserve other tabs’ records and explain when recovery needs a newer browser. Immutable request IDs survive reloads and handoffs. A newer revision from another coach clears stale Undo history, while an unchanged refresh or your own save acknowledgement preserves it.

Game ratings and plays use independent recovery records and saved receipts, preventing one tab from replacing another tab’s submission. Recovered approved submissions correctly offer Retry; drafts are never submitted until Save is pressed. Storage failures remain visible and do not promise a device backup when one cannot be saved. Timer displays and confirmed scores now use the same hundredth-second rounding.

The backend keeps durable score and lock request receipts in an additive RequestReceipts tab. Interrupted requests fail safely rather than blocking everyone or replaying over newer edits. Existing retained receipts are migrated; receipts already evicted by the previous server cannot be reconstructed. The same endpoint, permissions, scoring rules, gymnast marks and game rating data are retained.

Release checks use isolated local fixture data with the production Sheet connection blocked. They cover phone/iPad layouts, catalogue/profile navigation, all eight game interfaces, failed saves and two-tab recovery; production leaderboard marks are not changed for testing.

GitHub Pages hosts the app, and Google Sheets remains the shared data store. Scoring stays open; network failures preserve unsaved edits for retry.
