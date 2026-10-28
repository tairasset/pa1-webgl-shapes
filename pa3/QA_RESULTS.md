# Development verification

Updated 28 October 2026. These results describe software checks on a computer, not real-device AR experiments.

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

The updated English draft contains 954 counted words including table/diagram text, below the 1,200-word limit; E6 separately passes the 150-word guard. Its three rendered pages, all six pages of the updated Russian defence guide and all six pages of the new Android field guide were visually inspected. The documents use black headings, a charcoal table header and neutral backgrounds; there is no blue report theme. The Android video storyboard stays on one page.

## Supplied-course-material audit

All three supplied PDF chapters (5, 6, 7) and their corresponding slide decks were consulted for the relevant implementation topics. The traceability table and exact page/slide locators are in LECTURE_AUDIT_RU.md. Ch. 7 PDF pp. 9–11 and slide 9 group the critical tasks differently; the write-up now identifies the PDF's three tasks explicitly and preserves the application's explicit local-space selection. The actual pinned WebXRManager.js source was inspected because PA3 E2(c) requires it. No new external web research was used for this audit. Previous external reference links were replaced with supplied-course references except for that mandatory source inspection.

The E3 report now reads a separate placement_hit_matrix from a successful placement event and prints its numeric position as well as normal/tilt. Paired same-hit E1 matrices remain separate. All physical-result fields are still empty. Application JavaScript/HTML were unchanged in this documentation audit, so previously passed 28 application tests and browser checks were not relabelled as a new device run.

## Outstanding device checks

No accepted AR-capable device was available. Actual AR permission flow, sensor tracking, DOM-overlay behaviour in immersion, green/red device screenshots, tracking recovery, physical scale, return drift, anchors on/off comparison and full start/place/clear/stop/restart console behaviour are not verified on hardware. There is no demo.mp4. A desktop screenshot or simulated result must not be used as evidence for those checks.
