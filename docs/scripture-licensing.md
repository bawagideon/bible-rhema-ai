# Bible Rhema AI — Scripture Translation Licensing & Attribution Policy

This document establishes the legal and technical compliance policy for scripture translations utilized within the Bible Rhema AI platform, covering commercial distribution, fair use thresholds, required copyright attributions, and public-domain defaults.

---

## 1. Executive Summary

| Translation | Identifier | Status | Usage Scope | License / Permission Terms |
| :--- | :--- | :--- | :--- | :--- |
| **World English Bible** | `WEB` | Public Domain | Default Engine | Free worldwide for commercial and non-commercial use with no royalty or attribution obligation. |
| **King James Version** | `KJV` | Public Domain | Secondary Engine | Free worldwide (outside the United Kingdom Crown prerogative). |
| **American Standard Version** | `ASV` | Public Domain | Supported Engine | Free worldwide for commercial and non-commercial use. |
| **English Standard Version** | `ESV` | Copyright © Crossway | Canonical Cache & Quoting | Governed by Crossway ESV Fair Use Policy (maximum 500 verses; mandatory attribution notice). |

---

## 2. English Standard Version (ESV) Compliance & Fair Use

The English Standard Version (ESV®) is a copyrighted translation owned by Crossway, a publishing ministry of Good News Publishers. Bible Rhema AI strictly complies with the **Crossway ESV Fair Use Policy** for digital applications and print/electronic publications:

### 2.1 Crossway Fair Use Parameters
1. **Verse Limit**: The total scripture quoted does not exceed **500 verses** in aggregate within the application's permanent cache.
2. **Book Limit**: The verses quoted do not amount to a complete book of the Bible.
3. **Proportional Limit**: The verses quoted do not account for 50 percent or more of the total text of the work in which they are quoted.
4. **Attribution Notice**: Any display of ESV text must prominently display the official copyright notice.

### 2.2 Mandatory ESV Copyright Attribution
The application code enforces the following notice (exported via `ESV_COPYRIGHT_NOTICE` in `lib/bible/api-bible.ts`):

> *"Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved."*

### 2.3 Permanent ESV Cache Audit
Bible Rhema AI's embedded canonical cache (`CANONICAL_CACHE` in `lib/bible/api-bible.ts`) maintains an audited catalog of 12 essential christological and theological passages (such as John 3:16, Romans 8:28, Colossians 1:15-17, Philippians 4:6-7, Psalm 23:1-3, Isaiah 40:29-31, Ephesians 2:8-10, Proverbs 3:5-6, Matthew 28:18-20, Hebrews 11:1, 2 Timothy 3:16-17, Revelation 21:4).
- Total verses cached: **28 verses**.
- Percentage of Crossway 500-verse fair-use threshold: **5.6%**.
- Full un-abridged quotations: Checked and verified in the automated security test suite (`Test 9`).

---

## 3. Public Domain Default Engine (WEB & KJV)

For all dynamic, on-demand scripture lookups across all 66 books and 1,189 chapters of the Holy Bible:
1. **World English Bible (WEB)** is the primary default translation. It is an accurate modern-English revision of the American Standard Version (1901) released into the public domain without copyright restrictions.
2. **King James Version (KJV)** is provided as an alternative public domain translation.
3. **API.Bible Integration**: When dynamic retrieval is routed through the American Bible Society's API.Bible, public-domain Bible IDs are requested:
   - WEB: `9879dbb7cfe39e4d-04`
   - KJV: `de4e12af7f28f599-02`
   - ASV: `06125adad2d5898a-01`
4. **Honest Attribution**: If a user requests a copyrighted translation (e.g., NIV or ESV) that is not available via live licensed stream, Bible Rhema AI does **not** masquerade the result. Instead, it provides the public-domain WEB text with an explicit `isTranslationMismatch: true` flag and transparent attribution note:
   `"Requested NIV, displaying public domain World English Bible (WEB)."`

---

## 4. Architectural Verification

- `lib/bible/canonical-data.ts`: Validates canonical book counts, chapter counts, and verse boundaries across all 66 books and 1,189 chapters to prevent non-canonical or out-of-bounds queries.
- `lib/bible/api-bible.ts`: Enforces exact normalized book/chapter matching, contiguous verse ranges, and copyright constants (`ESV_COPYRIGHT_NOTICE`, `WEB_PUBLIC_DOMAIN_NOTICE`).
- `scripts/test-security-and-rag.mjs`: Tests exact match retrieval, copyright notice presence, range continuity, and translation mismatch transparency.
