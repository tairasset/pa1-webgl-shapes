# Development verification

Updated 28 October 2026. Development checks and the subsequently supplied real-device evidence are distinguished below. A finalized document does not mean every assignment requirement is met.

## Automated checks

Twenty-eight application tests passed against pinned Three.js 0.186.1 geometry and the actual application functions with simulated XRFrame input. The first twelve cover:

- ID-derived variant and malformed-ID rejection.
- Surface tilt from a normalised Y column, including exact threshold and downward normals.
- Facing the viewer at four positions using yaw only.
- Full product bounds, base centre and material type; driver membranes in front of the surrounds.
- Rejected tilted/missing hits consume the input and cannot trigger delayed placement.
- Missing tracking and emulated position hide the reticle and prevent placement.
- Single replacement deletes the old anchor; Clear deletes the current one.
- Anchors resolving after Clear are deleted without reinserting objects.
- End clears products, source and session state; restarting requests one source.
- A source resolving after end is cancelled.
- An already-invalidated source cannot interrupt state cleanup.
- Multi mode retains five placements and removes the oldest on the sixth.

Sixteen additional scenarios cover immediate pause without animation frames; avoiding viewer/hit/anchor queries while blurred or hidden; fresh-pose/hit/tap recovery; ordinary tracking-loss recovery; interrupted surface timing; starting behind system UI; stale session events; delayed reference-space results; missing anchor poses; persistent anchor-failure messages; dynamic variant labels; yaw-only placement on a tilted surface; keep-hit orientation; default feature negotiation; denied permissions; and failed STOP recovery.

Nine Python tests passed for evidence validation: valid structural shapes (including zero drift), empty data, blank device/non-finite measurements, booleans masquerading as measurements, repeated surface names, malformed matrices, outside-project screenshot paths, success/failure timing rules, and rejection of missing E3 placement evidence even when paired E1 hit matrices exist. These tests use explicitly synthetic fixtures and never populate measurements.json. The nine-test suite was rerun successfully after the lecture audit.

The Node VM test warning about experimental module support concerns the development harness; the browser application uses native ES modules.

## Browser inspection

The page loaded from a local HTTP server in the Codex in-app browser. Three.js loaded from the pinned CDN. The preview rendered; rotate and pause updated the control. Unsupported immersive AR produced a visible message and a disabled START AR control. Browser warn/error logs were empty after the final load and interaction check.

The desktop view and a 390 × 844 viewport were inspected visually. No overlapping text or horizontal overflow was visible. The temporary viewport override was then reset.

On 28 October, the updated local page was reloaded and rechecked in the in-app browser (reported Chrome 156.0.0.0 on Windows). Rotate worked, the diagnostic panel expanded, and attempting a surface trial without AR showed a visible explanation. Download evidence JSON produced student ID 242458, version 0.186.1 and zero events, as expected with no AR session. Empty events were not relabelled as device evidence. The warn/error log was empty during those checks. Both 390 × 844 and 1280 × 900 viewport overrides were inspected; document scroll width equalled client width in each case, so no horizontal overflow was detected. The viewport override was reset. These are local browser checks; publication is verified separately.

## Document inspection

The final writeup.pdf has seven pages: three text/data pages and four screenshot pages. Its content counter is 1,139 words including tables and captions; PDF extraction including all page footers gives 1,196 tokens separated by whitespace, still below 1,200. E6 has 106 words. DEFENSE_FINAL_RU.pdf has four pages. Every rendered page of both final PDFs was visually inspected after the last edit: text, matrix tables, screenshots, captions and footers fit without clipping. Black serif headings, charcoal tables and neutral backgrounds are used.

The older 954-word pre-device draft and six-page preparation guides are historical materials, superseded for delivery by the final report and final defence guide.

## Supplied-course-material audit

All three supplied PDF chapters (5, 6, 7) and their corresponding slide decks were consulted for the relevant implementation topics. The traceability table and exact page/slide locators are in LECTURE_AUDIT_RU.md. Ch. 7 PDF pp. 9–11 and slide 9 group the critical tasks differently; the write-up now identifies the PDF's three tasks explicitly and preserves the application's explicit local-space selection. The actual pinned WebXRManager.js source was inspected because PA3 E2(c) requires it. No new external web research was used for this audit. Previous external reference links were replaced with supplied-course references except for that mandatory source inspection.

The E3 report uses a separate placement_hit_matrix from a successful placement and prints numeric position and normal/tilt. Paired same-hit E1 matrices remain separate. Actual matrices and camera poses are now populated from user exports; physical scale and centimetre drift remain null. Application JavaScript/HTML were unchanged during finalization. Their SHA-256 hashes match the published checkout, preserving the version used for field data. The previously passed 28 application tests and desktop browser checks are not presented as newly performed hardware experiments.

## Supplied device evidence and remaining limits

The user supplied 38 screenshot attachments (30 unique original files by SHA-256) and four exports (54 unique events, with export-2 included in export-3). They establish actual AR sessions, placements, anchor creation, Clear, session end, green/red states and photos of both anchor modes. Same-session capture displacement is 1.165462 m; first tracked camera pose to final capture is 1.279138 m. Recalculation of the stored placement and red matrices gives 0 and 180 degrees respectively, matching the logs.

Export-3 provides new-session hit timing of 8.6658 s for the label Patterned and a 20 s timeout for Plain white. Manual repeated hits at 0.0883/0.0366 s are excluded from new-session timing. Material/time matching for the patterned trial and a third timed material are not established. Photos of two modes do not establish centimetre drift. Physical height, device identity, controlled tilted-board testing and absence of device console errors remain unverified. No demo.mp4 was supplied. The user explicitly requested finalization without further filming; no invented evidence is substituted. See FINAL_EVIDENCE_REVIEW_RU.md and SUBMISSION_LIMITATIONS.txt.

Nine structural validation tests were rerun successfully during finalization. The validator correctly rejects this actual dataset as incomplete. The package script stays strict by default; the explicit AllowIncompleteEvidence mode includes the limitations notice while retaining commit-history and deadline checks.

The final device-access revision adds the student's account of borrowing a friend's Android for about an hour, owning an iPhone and encountering lag/unreliable recording. The source of those difficulties was not diagnosed. Both updated first pages were rendered and visually inspected; the remaining nine pages are pixel-identical to the previously reviewed renderings.
