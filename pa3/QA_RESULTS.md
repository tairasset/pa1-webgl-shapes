# Development verification

27 October 2026. These results describe software checks on a computer, not real-device AR experiments.

## Automated checks

Twelve tests passed against the pinned Three.js 0.186.1 geometry and the actual application functions with simulated XRFrame input:

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

The Node VM test warning about experimental module support concerns the development harness; the browser application uses native ES modules.

## Browser inspection

The page loaded from a local HTTP server in the Codex in-app browser. Three.js loaded from the pinned CDN. The preview rendered; rotate and pause updated the control. Unsupported immersive AR produced a visible message and a disabled START AR control. Browser warn/error logs were empty after the final load and interaction check.

The desktop view and a 390 × 844 viewport were inspected visually. No overlapping text or horizontal overflow was visible. The temporary viewport override was then reset.

## Document inspection

The English draft contains approximately 803 counted prose words before table/diagram labels, below the 1,200-word limit. Its three rendered pages and all five pages of the Russian guide were visually inspected. The documents use black headings, a charcoal table header and neutral backgrounds; there is no blue report theme.

## Outstanding device checks

No accepted AR-capable device was available. Actual AR permission flow, sensor tracking, DOM-overlay behaviour in immersion, green/red device screenshots, tracking recovery, physical scale, return drift, anchors on/off comparison and full start/place/clear/stop/restart console behaviour are not verified on hardware. There is no demo.mp4. A desktop screenshot or simulated result must not be used as evidence for those checks.
