# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y\axeAccessibility.spec.ts >> Accessibility (WCAG 2.2 AA) >> Concierge view has no automatically detectable violations
- Location: tests\a11y\axeAccessibility.spec.ts:18:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 58

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
+                   ".active",
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
+           ".active",
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
      - button "Navigate" [ref=e12] [cursor=pointer]:
        - img [ref=e13]
        - text: Navigate
      - button "Concierge" [active] [pressed] [ref=e16] [cursor=pointer]:
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
    - region "Multilingual Concierge" [ref=e40]:
      - generic [ref=e41]:
        - heading "World Cup Multilingual Concierge" [level=2] [ref=e42]:
          - img [ref=e43]
          - text: World Cup Multilingual Concierge
        - generic [ref=e45]:
          - generic [ref=e48]: Hello! I am your FIFA 2026 Stadium Assistant. Select where you are, your destination, or ask me anything!
          - generic [ref=e49]:
            - textbox "Ask Concierge (RAG grounded)..." [ref=e50]
            - button "Send Message" [ref=e51] [cursor=pointer]:
              - img [ref=e52]
  - contentinfo [ref=e54]:
    - generic [ref=e55]:
      - text: "📍 Model venue:"
      - strong [ref=e56]: MetLife Stadium
      - text: (Lusail Generic Architecture)
    - button "Play demo scenario" [ref=e58] [cursor=pointer]:
      - img [ref=e59]
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
  15 |     expect(results.violations).toEqual([]);
  16 |   });
  17 | 
  18 |   test('Concierge view has no automatically detectable violations', async ({ page }) => {
  19 |     await openDatabaseBackedFanApp(page);
  20 |     await page.getByRole('button', { name: 'Concierge' }).click();
  21 |     await page.waitForSelector('.chat-container');
  22 | 
  23 |     const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
> 24 |     expect(results.violations).toEqual([]);
     |                                ^ Error: expect(received).toEqual(expected) // deep equality
  25 |   });
  26 | });
  27 | 
```