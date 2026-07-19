# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y\axeAccessibility.spec.ts >> Accessibility (WCAG 2.2 AA) >> Fan Portal has no automatically detectable violations
- Location: tests\a11y\axeAccessibility.spec.ts:6:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 686

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.12/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0ea5e9",
+               "contrastRatio": 2.77,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#ffffff",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.77 (foreground color: #ffffff, background color: #0ea5e9, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button class=\"view-btn active\" aria-pressed=\"true\">",
+                 "target": Array [
+                   ".view-btn.active",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.77 (foreground color: #ffffff, background color: #0ea5e9, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<button class=\"view-btn active\" aria-pressed=\"true\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".view-btn.active",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0d1323",
+               "contrastRatio": 3.88,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#64748b",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.88 (foreground color: #64748b, background color: #0d1323, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"stat-chip\" title=\"Average crowd density\"><span class=\"stat-chip-dot\" style=\"background: rgb(217, 119, 6);\"></span><span class=\"stat-chip-label\">Crowd</span><span class=\"stat-chip-value\" style=\"color: rgb(217, 119, 6);\">Moderate</span></div>",
+                 "target": Array [
+                   "div[title=\"Average crowd density\"]",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.88 (foreground color: #64748b, background color: #0d1323, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"stat-chip-label\">Crowd</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[title=\"Average crowd density\"] > .stat-chip-label",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0d1323",
+               "contrastRatio": 3.88,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#64748b",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.88 (foreground color: #64748b, background color: #0d1323, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"stat-chip\" title=\"Active alerts\">",
+                 "target": Array [
+                   "div[title=\"Active alerts\"]",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.88 (foreground color: #64748b, background color: #0d1323, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"stat-chip-label\">Alerts</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[title=\"Active alerts\"] > .stat-chip-label",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0d1323",
+               "contrastRatio": 3.88,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#64748b",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.88 (foreground color: #64748b, background color: #0d1323, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"stat-chip\" title=\"Route distance\">",
+                 "target": Array [
+                   "div[title=\"Route distance\"]",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.88 (foreground color: #64748b, background color: #0d1323, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"stat-chip-label\">Distance</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[title=\"Route distance\"] > .stat-chip-label",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0d1323",
+               "contrastRatio": 3.88,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#64748b",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.88 (foreground color: #64748b, background color: #0d1323, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"stat-chip\" title=\"Estimated walk time\">",
+                 "target": Array [
+                   "div[title=\"Estimated walk time\"]",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.88 (foreground color: #64748b, background color: #0d1323, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"stat-chip-label\">ETA</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[title=\"Estimated walk time\"] > .stat-chip-label",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0d1321",
+               "contrastRatio": 3.89,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#64748b",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.89 (foreground color: #64748b, background color: #0d1321, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<article class=\"glass-panel flex flex-col gap-4\" aria-labelledby=\"find-my-way-title\">",
+                 "target": Array [
+                   "article",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.89 (foreground color: #64748b, background color: #0d1321, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<div class=\"switch-subtext\">Avoids stairs, prefers lifts and ramps</div>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".switch-subtext",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0e1627",
+               "contrastRatio": 3.79,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#64748b",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.79 (foreground color: #64748b, background color: #0e1627, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button role=\"tab\" aria-selected=\"false\" class=\"category-tab \">🚪 Gates</button>",
+                 "target": Array [
+                   ".category-tab[role=\"tab\"]:nth-child(2)",
+                 ],
+               },
+               Object {
+                 "html": "<article class=\"glass-panel flex flex-col gap-4\" aria-labelledby=\"find-my-way-title\">",
+                 "target": Array [
+                   "article",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.79 (foreground color: #64748b, background color: #0e1627, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<button role=\"tab\" aria-selected=\"false\" class=\"category-tab \">🚪 Gates</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".category-tab[role=\"tab\"]:nth-child(2)",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0e1627",
+               "contrastRatio": 3.79,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#64748b",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.79 (foreground color: #64748b, background color: #0e1627, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button role=\"tab\" aria-selected=\"false\" class=\"category-tab \">🪑 Seats</button>",
+                 "target": Array [
+                   ".category-tab[role=\"tab\"]:nth-child(3)",
+                 ],
+               },
+               Object {
+                 "html": "<article class=\"glass-panel flex flex-col gap-4\" aria-labelledby=\"find-my-way-title\">",
+                 "target": Array [
+                   "article",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.79 (foreground color: #64748b, background color: #0e1627, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<button role=\"tab\" aria-selected=\"false\" class=\"category-tab \">🪑 Seats</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".category-tab[role=\"tab\"]:nth-child(3)",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0e1627",
+               "contrastRatio": 3.79,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#64748b",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.79 (foreground color: #64748b, background color: #0e1627, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button role=\"tab\" aria-selected=\"false\" class=\"category-tab \">🏥 Facilities</button>",
+                 "target": Array [
+                   ".category-tab[role=\"tab\"]:nth-child(4)",
+                 ],
+               },
+               Object {
+                 "html": "<article class=\"glass-panel flex flex-col gap-4\" aria-labelledby=\"find-my-way-title\">",
+                 "target": Array [
+                   "article",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.79 (foreground color: #64748b, background color: #0e1627, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<button role=\"tab\" aria-selected=\"false\" class=\"category-tab \">🏥 Facilities</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".category-tab[role=\"tab\"]:nth-child(4)",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0d1c2d",
+               "contrastRatio": 3.61,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#64748b",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.61 (foreground color: #64748b, background color: #0d1c2d, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"route-summary-card\">",
+                 "target": Array [
+                   ".route-summary-card",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"glass-panel\">",
+                 "target": Array [
+                   ".glass-panel:nth-child(3)",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.61 (foreground color: #64748b, background color: #0d1c2d, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<div class=\"eta-bar-label\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".eta-bar-label",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#191f2c",
+               "contrastRatio": 3.46,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#64748b",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.46 (foreground color: #64748b, background color: #191f2c, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<span class=\"step-floor\">Ground Floor</span>",
+                 "target": Array [
+                   ".step-row:nth-child(1) > .step-content > .step-meta > .step-floor",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"glass-panel\">",
+                 "target": Array [
+                   ".glass-panel:nth-child(3)",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.46 (foreground color: #64748b, background color: #191f2c, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"step-floor\">Ground Floor</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".step-row:nth-child(1) > .step-content > .step-meta > .step-floor",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#191f2c",
+               "contrastRatio": 3.46,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#64748b",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.46 (foreground color: #64748b, background color: #191f2c, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<span class=\"step-floor\">Ground Floor</span>",
+                 "target": Array [
+                   ".step-row:nth-child(2) > .step-content > .step-meta > .step-floor",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"glass-panel\">",
+                 "target": Array [
+                   ".glass-panel:nth-child(3)",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.46 (foreground color: #64748b, background color: #191f2c, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"step-floor\">Ground Floor</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".step-row:nth-child(2) > .step-content > .step-meta > .step-floor",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+   Object {
+     "description": "Ensure select element has an accessible name",
+     "help": "Select element must have an accessible name",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.12/select-name?application=playwright",
+     "id": "select-name",
+     "impact": "critical",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "implicit-label",
+             "impact": "critical",
+             "message": "Element does not have an implicit (wrapped) <label>",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "explicit-label",
+             "impact": "critical",
+             "message": "Element does not have an explicit <label>",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-label",
+             "impact": "critical",
+             "message": "aria-label attribute does not exist or is empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-labelledby",
+             "impact": "critical",
+             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": Object {
+               "messageKey": "noAttr",
+             },
+             "id": "non-empty-title",
+             "impact": "critical",
+             "message": "Element has no title attribute",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "presentational-role",
+             "impact": "critical",
+             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element does not have an implicit (wrapped) <label>
+   Element does not have an explicit <label>
+   aria-label attribute does not exist or is empty
+   aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
+   Element has no title attribute
+   Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
+         "html": "<select class=\"form-select m-0\"><option value=\"gate_metlife\">MetLife Gate</option></select>",
+         "impact": "critical",
+         "none": Array [],
+         "target": Array [
+           ".form-select",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.forms",
+       "wcag2a",
+       "wcag412",
+       "section508",
+       "section508.22.n",
+       "TTv5",
+       "TT5.c",
+       "EN-301-549",
+       "EN-9.4.1.2",
+       "ACT",
+       "RGAAv4",
+       "RGAA-11.1.1",
+     ],
+   },
+   Object {
+     "description": "Ensure touch targets have sufficient size and space",
+     "help": "All touch targets must be 24px large, or leave sufficient space",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.12/target-size?application=playwright",
+     "id": "target-size",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "height": 19,
+               "minSize": 24,
+               "width": 91,
+             },
+             "id": "target-size",
+             "impact": "serious",
+             "message": "Target has insufficient size (91px by 19px, should be at least 24px by 24px)",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": Object {
+               "closestOffset": 19,
+               "minOffset": 24,
+             },
+             "id": "target-offset",
+             "impact": "serious",
+             "message": "Target has insufficient space to its closest neighbors. Safe clickable space has a diameter of 19px instead of at least 24px.",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<button class=\"btn-secondary py-1 px-3 text-xs\">Login / Sign up</button>",
+                 "target": Array [
+                   ".px-3",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Target has insufficient size (91px by 19px, should be at least 24px by 24px)
+   Target has insufficient space to its closest neighbors. Safe clickable space has a diameter of 19px instead of at least 24px.",
+         "html": "<select class=\"bg-transparent border-none text-xs text-slate-300 outline-none font-semibold cursor-pointer\" aria-label=\"Website language\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".bg-transparent",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.sensory-and-visual-cues",
+       "wcag22aa",
+       "wcag258",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - generic [ref=e9]: MetLife Stadium
      - generic [ref=e10]: Fan App
      - generic "Connected to telemetry server"
    - navigation "Main Navigation" [ref=e11]:
      - button "Navigate" [pressed] [ref=e12] [cursor=pointer]:
        - img [ref=e13]
        - text: Navigate
      - button "Concierge" [ref=e16] [cursor=pointer]:
        - img [ref=e17]
        - text: Concierge
      - button "Match Centre" [ref=e19] [cursor=pointer]:
        - img [ref=e20]
        - text: Match Centre
      - button "Food Order" [ref=e26] [cursor=pointer]:
        - img [ref=e27]
        - text: Food Order
    - generic [ref=e30]:
      - generic "Website language" [ref=e31]:
        - img [ref=e32]
        - combobox "Website language" [ref=e36]:
          - option "English" [selected]
          - option "Arabic"
          - option "Spanish"
          - option "Hindi"
          - option "French"
          - option "Portuguese"
      - button "Login / Sign up" [ref=e37] [cursor=pointer]
      - text: Seed 2026|12:35:30 AM
  - main [ref=e38]:
    - region "Fan Portal" [ref=e39]:
      - generic [ref=e40]:
        - generic "Average crowd density" [ref=e41]:
          - generic [ref=e43]: Crowd
          - generic [ref=e44]: Moderate
        - generic "Active alerts" [ref=e45]:
          - img [ref=e46]
          - generic [ref=e49]: Alerts
          - generic [ref=e50]: "1"
        - generic "Route distance" [ref=e51]:
          - img [ref=e52]
          - generic [ref=e55]: Distance
          - generic [ref=e56]: 10m
        - generic "Estimated walk time" [ref=e57]:
          - img [ref=e58]
          - generic [ref=e61]: ETA
          - generic [ref=e62]: 0.3 min
      - article "Find My Way" [ref=e63]:
        - heading "Find My Way" [level=2] [ref=e65]:
          - img [ref=e66]
          - text: Find My Way
        - generic [ref=e69]:
          - text: 📍 Where are you now?
          - combobox [ref=e70]:
            - option "MetLife Gate" [selected]
        - generic [ref=e71]:
          - checkbox "♿ Step-free route" [ref=e72] [cursor=pointer]
          - generic [ref=e73]:
            - text: ♿ Step-free route
            - generic [ref=e74]: Avoids stairs, prefers lifts and ramps
        - generic [ref=e75]:
          - text: ⚡ Quick Destinations
          - generic [ref=e76]:
            - button "🚻 Nearest Restroom" [ref=e77] [cursor=pointer]:
              - generic [ref=e78]: 🚻
              - generic [ref=e79]: Nearest Restroom
            - button "🍔 Nearest Food" [ref=e80] [cursor=pointer]:
              - generic [ref=e81]: 🍔
              - generic [ref=e82]: Nearest Food
            - button "🏥 First Aid" [ref=e83] [cursor=pointer]:
              - generic [ref=e84]: 🏥
              - generic [ref=e85]: First Aid
            - button "🕌 Prayer Room" [ref=e86] [cursor=pointer]:
              - generic [ref=e87]: 🕌
              - generic [ref=e88]: Prayer Room
            - button "🛗 Lift / Elevator" [ref=e89] [cursor=pointer]:
              - generic [ref=e90]: 🛗
              - generic [ref=e91]: Lift / Elevator
        - generic [ref=e92]:
          - text: 🔍 Search Destination
          - tablist "Destination Categories" [ref=e93]:
            - tab "🗺️ All" [selected] [ref=e94] [cursor=pointer]
            - tab "🚪 Gates" [ref=e95] [cursor=pointer]
            - tab "🪑 Seats" [ref=e96] [cursor=pointer]
            - tab "🏥 Facilities" [ref=e97] [cursor=pointer]
          - generic [ref=e98]:
            - img [ref=e99]
            - textbox "Type gate, section, food, prayer..." [ref=e102]
      - generic [ref=e103]:
        - heading "Step-by-Step Directions" [level=3] [ref=e104]:
          - img [ref=e105]
          - text: Step-by-Step Directions
        - generic [ref=e107]:
          - generic [ref=e108]:
            - generic [ref=e109]:
              - generic [ref=e110]:
                - img [ref=e111]
                - generic [ref=e114]: MetLife Gate
              - img [ref=e115]
              - generic [ref=e117]:
                - img [ref=e118]
                - generic [ref=e121]: South Concourse
            - generic [ref=e122]:
              - generic [ref=e123]:
                - img [ref=e124]
                - text: 10m
              - generic [ref=e127]:
                - img [ref=e128]
                - text: ~0.3 min
              - generic [ref=e131]: 2 waypoints
              - generic [ref=e132]: ⚠️ Rerouted (crowd)
            - generic [ref=e133]:
              - generic [ref=e134]:
                - img [ref=e135]
                - text: Walking time
              - generic [ref=e140]: 0.3 min
          - generic [ref=e141]:
            - generic [ref=e142]:
              - generic [ref=e144]: 📍
              - generic [ref=e146]:
                - generic [ref=e147]: Start at MetLife Gate
                - generic [ref=e149]: Ground Floor
            - generic [ref=e150]:
              - generic [ref=e152]: 🏁
              - generic [ref=e153]:
                - generic [ref=e154]: Arrived at South Concourse
                - generic [ref=e156]: Ground Floor
    - generic [ref=e157]:
      - generic [ref=e158]:
        - button "Zoom In" [ref=e159] [cursor=pointer]:
          - img [ref=e160]
        - button "Zoom Out" [ref=e163] [cursor=pointer]:
          - img [ref=e164]
        - button "Reset View" [ref=e167] [cursor=pointer]:
          - img [ref=e168]
      - img [ref=e171]:
        - generic [ref=e187]:
          - generic [ref=e189]: 51%
          - generic [ref=e191]: 86%
          - generic [ref=e193]: 68%
          - generic [ref=e195]: 28%
        - generic [ref=e203] [cursor=pointer]:
          - generic: M
          - generic:
            - generic: 📍 YOU ARE HERE
        - generic [ref=e213]:
          - generic [ref=e215]: FLOOR LEVELS
          - generic [ref=e218]: Ground (Gates)
          - generic [ref=e221]: Level 1 (100s)
          - generic [ref=e224]: Level 2 (200s)
          - generic [ref=e227]: Level 3 (300s)
      - generic [ref=e228]:
        - generic [ref=e229]: Crowd Capacity
        - generic [ref=e230]:
          - generic [ref=e231]: 0-39%
          - generic [ref=e232]: 40-59%
          - generic [ref=e233]: 60-79%
          - generic [ref=e234]: 80-89%
          - generic [ref=e235]: 90%+
  - contentinfo [ref=e236]:
    - generic [ref=e237]:
      - text: "📍 Model venue:"
      - strong [ref=e238]: MetLife Stadium
      - text: (Lusail Generic Architecture)
    - button "Play demo scenario" [ref=e240] [cursor=pointer]:
      - img [ref=e241]
      - text: Play demo scenario
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import AxeBuilder from '@axe-core/playwright';
  3  | import { openDatabaseBackedFanApp } from '../support/databaseFixture';
  4  | 
  5  | test.describe('Accessibility (WCAG 2.2 AA)', () => {
  6  |   test('Fan Portal has no automatically detectable violations', async ({ page }) => {
  7  |     await openDatabaseBackedFanApp(page);
  8  |     await page.waitForSelector('svg.map-svg');
  9  | 
  10 |     const results = await new AxeBuilder({ page })
  11 |       .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
  12 |       .exclude('.razorpay-checkout-frame')
  13 |       .analyze();
  14 | 
> 15 |     expect(results.violations).toEqual([]);
     |                                ^ Error: expect(received).toEqual(expected) // deep equality
  16 |   });
  17 | 
  18 |   test('Concierge view has no automatically detectable violations', async ({ page }) => {
  19 |     await openDatabaseBackedFanApp(page);
  20 |     await page.getByRole('button', { name: 'Concierge' }).click();
  21 |     await page.waitForSelector('.chat-container');
  22 | 
  23 |     const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
  24 |     expect(results.violations).toEqual([]);
  25 |   });
  26 | });
  27 | 
```