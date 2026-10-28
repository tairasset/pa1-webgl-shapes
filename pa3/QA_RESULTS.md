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

Eight Python tests passed for evidence validation: valid structural shapes (including zero drift), empty data, blank device/non-finite measurements, booleans masquerading as measurements, repeated surface names, malformed matrices, outside-project screenshot paths, and success/failure timing rules. These tests use explicitly synthetic fixtures and never populate measurements.json.

The Node VM test warning about experimental module support concerns the development harness; the browser application uses native ES modules.

## Browser inspection

The page loaded from a local HTTP server in the Codex in-app browser. Three.js loaded from the pinned CDN. The preview rendered; rotate and pause updated the control. Unsupported immersive AR produced a visible message and a disabled START AR control. Browser warn/error logs were empty after the final load and interaction check.

The desktop view and a 390 × 844 viewport were inspected visually. No overlapping text or horizontal overflow was visible. The temporary viewport override was then reset.

On 28 October, the updated local page was reloaded and rechecked in the in-app browser (reported Chrome 156.0.0.0 on Windows). Rotate worked, the diagnostic panel expanded, and attempting a surface trial without AR showed a visible explanation. Download evidence JSON produced student ID 242458, version 0.186.1 and zero events, as expected with no AR session. Empty events were not relabelled as device evidence. The warn/error log was empty during those checks. Both 390 × 844 and 1280 × 900 viewport overrides were inspected; document scroll width equalled client width in each case, so no horizontal overflow was detected. The viewport override was reset. These are local browser checks; publication is verified separately.

## Document inspection

The English draft contains 868 counted words including table/diagram text, below the 1,200-word limit; E6 separately passes the 150-word guard. Its three rendered pages and all six pages of the updated Russian guide were visually inspected. The documents use black headings, a charcoal table header and neutral backgrounds; there is no blue report theme.

## Outstanding device checks

No accepted AR-capable device was available. Actual AR permission flow, sensor tracking, DOM-overlay behaviour in immersion, green/red device screenshots, tracking recovery, physical scale, return drift, anchors on/off comparison and full start/place/clear/stop/restart console behaviour are not verified on hardware. There is no demo.mp4. A desktop screenshot or simulated result must not be used as evidence for those checks.
