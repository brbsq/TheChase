# The Chase

Camera-controlled classroom sprint racing with questions, three answer lanes and hurdles. Built from the latest private Sprint Quiz prototype, with the supplied The Chase artwork, six animated characters and three music tracks.

## Run and build

Node.js 22 or later; no dependencies are required for the static build.

```sh
npm test
npm run build:pages
npm run preview
```

Local preview: `http://localhost:5178/game/`. GitHub Pages serves `dist/`; the root redirects to `game/` and preserves phone-controller links. `.github/workflows/pages.yml` tests, builds and publishes every push to `main`. The intended repository is `brbsq/TheChase`.

## Firebase connection

Connected project: `thechase-brbsq` (TheChase), owned by the signed-in personal account. The project stays on the free Spark plan with billing disabled. Realtime Database is in Singapore (`asia-southeast1`). Anonymous authentication is enabled for camera pairing; Google sign-in is enabled for private teacher question banks. The approved sign-in domains are `brbsq.github.io`, `localhost` and `127.0.0.1`.

`public/game/firebase-config.js` contains the public Web SDK configuration. Never put service-account keys or access tokens in this repository. `.firebaserc` selects the project and `firebase/database.rules.json` contains the deployed access rules. Publish the game with GitHub Pages; Firebase provides the backend.

To deploy backend changes:

```sh
npx -y firebase-tools@latest deploy --only database,auth --project thechase-brbsq
```

In the currently installed CLI, auth deployment enables providers but does not apply `authorizedDomains`; verify any domain changes in Firebase Console → Authentication → Settings → Authorized domains. Keep this allowlist limited to approved game origins.

Live disposable-account checks passed for anonymous sign-in, PIN lookup, private signaling, one camera claim, immutable answers and anonymous bank-write denial; test records/accounts were removed afterwards. Physical-device video/motion and teacher Google sign-in are separate browser checks.

### Camera pairing

Firebase Authentication gives game and camera devices separate anonymous pairing identities, isolated from teacher Google sign-in so using the same teacher account on both devices does not block pairing. Realtime Database carries the WebRTC offer/answer. The six-digit PIN expires after five minutes, session access expires after ten minutes, and only one camera can claim a session. Database rules prevent listing sessions or PINs, reading an unclaimed offer, overwriting a camera claim, changing another host's session, or submitting more than one answer. The host removes signaling records after connection and registers disconnect cleanup. Expired abandoned records are inaccessible; no scheduled background deletion is included. PIN lookups require authentication but do not yet have the old server's per-network attempt limit; production abuse protection should be added before broad unsupervised use.

Video stays on the camera device. Only derived movement events go over the WebRTC data channel. STUN is configured; TURN is not included, so restrictive Wi-Fi networks may prevent peer connections.

### Question banks

Open Question Bank and sign in with Google. Each teacher owns a private library of named question sets that syncs between their signed-in devices. Anonymous camera identities cannot read or modify those banks. Edits and selected deletions stay in an unsaved batch. One three-step confirmation commits the whole batch; Firebase saves use revision checks to reject overwriting a newer device's version. Legacy local questions migrate to a separate Custom set. Every JSON paste/import creates a new set with editable title and Year/category; existing sets are not appended to. Saved categories and titles appear in race selection. Existing local questions remain usable; Save this device's bank to Firebase migrates them after confirmation. Loading a cloud bank keeps a backup of the former local bank under `chase-question-sets-backup` in browser storage. Starter packs are bundled samples and do not claim curriculum certification.

## Tests

`npm test` covers motion/race rules, independent falls, all six rigs, audio/loading, editable questions and GitHub Pages paths.

The Firebase emulator test is dependency-free and uses simulated end-user tokens. Start the official Realtime Database emulator on `127.0.0.1:9000`, then run:

```sh
npm run test:firebase
```

It checks owner/guest access, single camera claims, expiry, immutable answers, private teacher banks, anonymous write denial and conflicting revisions. It never contacts production. Live mobile camera pairing and Google sign-in still need physical-device testing.

## Playing

Questions appear before hurdles. Keep jogging, wave your left or right hand or arm to select a lane, then jump vertically during the highlighted final 1.25 seconds. Wrong answers and missed hurdles make only that runner fall and recover; opponents continue. Shared lanes and split screen retain all runners. Race targets can use questions, time, distance or endless chase.

Keyboard: P1 arrows / Space / R; P2 A D / W / S; P3 J L / I / K; P4 F H / T / G. Music attempts autoplay at 50%, falls back to the first interaction, and has volume controls in Settings plus a mute button. Camera loss pauses the race rather than applying a jogging penalty.

## Technical references

- [Firebase web setup](https://firebase.google.com/docs/web/setup)
- [Firebase database rules](https://firebase.google.com/docs/database/security/rules-conditions)
- [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Player names are replaced with P1–P4 IDs and clear AI labels. The in-race player card is removed, keyboard controls use a compact centered dock with larger buttons, and pause uses an SVG two-bar icon.

## Classroom control update

Players stand anywhere their whole body is visible; there are no numbered standing zones. Tap a detected person to open P1–P4 assignment, or use Lock all players. The tracker matches bodies between frames rather than reassigning by screen section. Crossing or overlapping bodies can still confuse pose tracking; use re-lock to restore assignments.

Pause includes Re-lock / reconnect camera, a live preview and Lock all players. It preserves the current race, score and timer. Phone cameras can receive a re-lock request, or pair again within the paused race. Resume after tracking loss requires a fresh calibrated frame with every active player visible.

Motion sampling targets 30fps (hardware dependent), with smaller step/jump thresholds and faster jogging detection. Both feet must rise for a vertical answer jump. Sideways hops last 0.42s, lane changes take 0.36s, and a jump can immediately interrupt a hop. Input animation uses a short blend rather than waiting for the previous hop to finish.

Solo choices glow yellow. Labelled player badges show each multiplayer choice; after the hurdle, green means correct plus jump and red means wrong or missed jump. A mixed outcome on one option shows separate coloured badges. Answer review groups responses per question and includes larger text, the correct answer and a simple explanation. All bundled questions have authored explanations; imported/manual questions can store optional explanations, with a basic answer recap otherwise. Short recorded crowd cheers accompany a correct answer with a cleared hurdle; a disappointed “aww” accompanies wrong answers or missed jumps, with the supplied rubber-duck squeak at a fall or failed hurdle, followed by the “aww” after a brief pause. Crowd recordings are bundled locally; source and license details are in `public/game/audio/CREDITS.md`. Clouds drift and trees sway, respecting reduced-motion preferences.

Automated simulated-pose checks cover free-position assignments, individual locks, re-lock recovery, small motions, immediate keyboard actions and per-player outcome feedback. Real classroom camera latency and multi-person occlusion still require physical-device testing.

Jogging uses a high-sensitivity knee-lift threshold relative to each locked stance, with a small deadband for tracking jitter. Small repeated lifts (including the same leg) refresh jogging, and an 850ms hold bridges a relaxed cadence. A held raised knee does not keep jogging indefinitely.

Pages builds fingerprint local JavaScript/CSS and the complete import graph to avoid stale mixed client versions after deployment. Camera pairing identities use in-memory persistence; teacher sign-in prefers local storage with an in-memory fallback on storage-limited devices.

### Classroom camera and community updates

Pair Device opens a dedicated PIN/QR connection and camera test, independent of race settings. The WebRTC connection stays open between races; player-count changes reset camera locks on the phone. The paired preview is sent directly over WebRTC, with no Firebase video storage. Motion still runs on the camera device. Both devices must keep their browser open.

Camera hops use the opposite horizontal direction and a smaller lateral threshold, with a centre deadband before the next hop. Lock all captures all currently detected full bodies, even if some selected players are temporarily missing; starting still requires every selected player to be visible and locked.

Keyboard/touch mode shows one independent control group per human player. Settings checks camera availability and shows current device connection status.

The Public Question Bank reads the latest 30 opt-in community sets. Google-authenticated owners may publish up to 30 bounded sets and unpublish their own entries. Existing private banks are never automatically published. Publishing requires a saved set plus the public-sharing checkbox; copying a community set creates a new private draft for review. No author emails are exposed. Public content should be checked by the teacher before class. The deployment workflow tests private/public Firebase access rules in the local emulator before deploying Pages.

### AI Assist suggestions

The AI prompt builder supports Years 1–6 and 1–50 questions, with optional count suggestions from 10 to 50 in steps of five. Both question count and topic remain editable. Common grammar topic suggestions were selected from the KPM-authored [Primary Year 3 syllabus](https://padlet-uploads.storage.googleapis.com/214113651/37ce2f42feab7f3db297ab7a92f7586d/SyllabusYear_3.pdf) and [Year 6 DSKP, pages 45–46 and the Years 4–5 appendix](https://c.zoom-a.com/cache/dbp/refpub/1668665277967/DSKP-Th6-BI.pdf). They are convenient starting points, not a per-year curriculum coverage checklist. Teachers should review all generated questions.

### Editable starter packs and the question workspace

Starter sets now appear directly in Question Bank. Viewing is read-only until the first edit creates a private draft override. Saved overrides (including deletion markers and bank membership) sync using the existing private Firebase bank record. Removing a set from the user bank excludes it from races but keeps it editable; deleting a starter hides it until restored. Bundled defaults and other users' banks are unchanged. Restore deleted starter packs does not overwrite other starter edits. The existing 30-saved-set/override limit still applies.

The question workspace uses a sidebar, large coloured answer cards and a correct-answer toggle, with reorder, duplicate and batch deletion, informed by the [Kahoot creator workflow](https://support.kahoot.com/hc/en-us/articles/115002884788-How-to-make-a-kahoot). The community browser follows [Wordwall community discovery](https://wordwall.net/community) with search, categories, source filters, resource cards and a preview. Starter cards are explicitly labelled, never presented as other users' posts. Community listing remains bounded to the 30 latest shared sets. Publication status is loaded from the signed-in owner's public slots, so previously published sets show Publish changes after reload or sign-in. Settings exposes the existing Google sign-in/sign-out and bank sync controls.

Popups use 200ms opacity/display transitions and a small panel movement, with reduced-motion support and immediate input deactivation while closing. Embedded menu panels keep their location until their closing transition completes; rapid reopening cancels pending placement changes.

Question set editor updates: each bundled year now has one complete **Sample**, with no generated eight-question subsets. Existing saved selections keep their questions as independent saved sets. Sets include Year and Subject metadata, and subject-aware AI topic suggestions remain editable. Subject names follow the [Malaysian government's primary-school overview](https://www.malaysia.gov.my/my/topics/sekolah-kebangsaan) and [KPM's 2025 assessment guidance](https://www.moe.gov.my/storage/files/shares/pentaksiran-berasaskan-sekolah/1.%20Panduan%20Pengurusan%20PBS%20Edisi%201%20Tahun%202025_Mei.pdf). Suggestions are teacher aids, not certified curriculum coverage.

The question rail supports drag-to-reorder and accessible Move up / Move down buttons. Question-order preferences are shared between Settings and race setup and saved on this device. Sequential mode preserves question order; answer positions still vary. Audio controls separate master mute, music mute and sound effects; button clicks follow master mute and the effects setting. Camera setup selects a connected external camera first, then a running or previously enabled built-in camera; enabling a camera still uses the normal browser permission flow.

The interface starts in English on every visit. The language selector switches to 华语 or Bahasa Melayu for the current visit. Menus, controls, guidance, status messages and accessibility labels use the shared translation catalog. Teacher-authored titles, questions, answers, explanations and publisher names retain their original content. Translated option labels keep explicit stable values so changing interface language cannot change a set's Year or Subject.

Learning-topic suggestions are selected by both Year and SJK(C) Subject in set titles, AI assist and public-library keyword search; titles and keywords also accept free typing. They are editable planning suggestions, not certified textbook-unit coverage. See the [KPM primary textbook catalogue](https://www.moe.gov.my/storage/files/shares/Banner/E-Katalog%20Buku%20Teks%20KPM.pdf) and [KPM curriculum alignment notice](https://www.moe.gov.my/storage/files/shares/pekeliling_dan_garis_panduan/surat_siaran/bahagian-pengurusan-sekolah-harian/Surat%20Siaran%20KPM%20Bil.%206%202024%20Pelaksanaan%20Dokumen%20Penjajaran%20Kurikulum%20Standard%20Sekolah%20Rendah%20Edisi%203%20Sains%20Dan%20Math%20Tahap%201.pdf) for official references. History and RBT selections start in Year 4. AI question-count choices are 10–50 in steps of five.

Publishing stays disabled until the sharing consent is checked. New publications include the signed-in teacher's display name, never their email; old publications without this optional field show “Publisher name unavailable” until republished. The public-library cover shows Subject and Year, with publisher information below. Dragging uses before/after insertion markers and rail-edge autoscroll, while keyboard-accessible move controls remain available. Button audio plays the supplied `mixkit-single-key-type-2533.wav` recording unchanged; master mute, music-only mute and the sound-effects checkbox stay synchronized.

Manual Creation and Question Set Editor share the metadata workspace and question editor. My Question Sets lists saved personal sets. Editable topic dropdowns use Year and Subject suggestions while retaining free typing.

My Classes in Settings supports adding, editing, removing and restoring device-local classes. Circular selectors in solo and multiplayer setup retain the selected class. Completed results and leaderboard entries store a class snapshot, so later class edits do not rename earlier results.

Class selection uses the supplied classroom glyph with a transparent background, a compact three-column chooser and a Year-first management form. Character portraits are rendered with alpha using a disposable portrait renderer. Shuffle guidance follows the saved toggle state in both Settings and race setup. Recent races display two visual podium cards per row; selecting a card opens standings and distances in a separate details popup.

The canonical URL is https://brbsq.github.io/TheChase/. Its stable entry loader fetches `release.json` without caching and opens the current game HTML with a build fingerprint. Old `release` query labels are removed; phone pairing hashes and other parameters are preserved. Each Pages deployment replaces the live artifact. Superseded workflow runs are canceled, and the publish step checks that it still represents the latest `main` commit.

After a successful publish, the workflow marks superseded successful Pages deployments inactive. It first verifies that the new deployment succeeded and still matches `main`; source commits and historical build records remain available for recovery.

## Local account and external-camera preview

On localhost, Firebase Auth and Realtime Database use the isolated `demo-thechase` emulators (ports 9099 and 9000). Run `firebase emulators:start --only auth,database --project demo-thechase` alongside the local server. Hosted URLs continue using the configured Firebase project.

Classes sync privately under `teacherClasses/<uid>/<classId>` for signed-in teachers. Guest classes remain local and migrate once into the first signed-in account. Separate account caches, offline pending edits, and per-class writes prevent one account or device from replacing another's independent changes. Archiving and restoring a class sync across devices; selected class remains device-specific. Deploy the accompanying database rules only after preview approval.

Enable camera opens a source menu in solo and multiplayer. External camera becomes available and green when a paired device supplies a live video track. The external controller has Device menu (PIN/QR entry) and Full-screen camera controls, with a viewport fallback for browsers without native fullscreen. Returning to its menu stops capture and disconnects the pairing session. Open `/game/index.html#device` directly for the device-only menu. Physical phone capture requires a reachable HTTPS origin; laptop localhost links cannot be opened from another device.
