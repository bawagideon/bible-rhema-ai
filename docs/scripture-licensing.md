# Bible Rhema AI — Scripture Translation Licensing & Attribution Policy

This document details the legal status, fair use boundaries, commercial licensing requirements, and technical controls for scripture translations utilized within the Bible Rhema AI platform.

---

## 1. Executive Summary & Legal Status Matrix

| Translation | Identifier | Legal Status | Commercial Clearance Status | Recommended Production Scope |
| :--- | :--- | :--- | :--- | :--- |
| **World English Bible** | `WEB` | Public Domain (Worldwide) | **Fully Cleared** (No royalties, permissions, or license required) | **Primary Default Engine** for all dynamic lookups, RAG prompts, and AI sermon workflows. |
| **King James Version** | `KJV` | Public Domain (Worldwide outside UK Crown) | **Fully Cleared** (Free for commercial digital distribution) | **Secondary Public Domain Engine** for devotional and liturgical contexts. |
| **American Standard Version** | `ASV` | Public Domain (Worldwide) | **Fully Cleared** (1901 text free of copyright) | Supported via API.Bible open stream. |
| **English Standard Version** | `ESV` | Copyright © 2001 Crossway | **Conditional / Non-Exclusive Notice** (Subject to commercial licensing review) | Restricted to fair-use reference verification. Commercial SaaS deployment should operate with `NEXT_PUBLIC_PUBLIC_DOMAIN_ONLY=true` until a negotiated Crossway digital license is executed. |

---

## 2. English Standard Version (ESV®) Licensing Review

The English Standard Version (ESV®) is a copyrighted translation owned by Crossway, a publishing ministry of Good News Publishers. 

### 2.1 Crossway Fair Use Parameters (Digital & Print)
Crossway's published Fair Use Policy permits quoting the ESV up to:
1. **500 verses** in aggregate without formal written permission.
2. The verses quoted must not amount to a complete book of the Bible.
3. The verses quoted must not account for 50 percent or more of the total text of the work.
4. Mandatory copyright attribution must be visibly displayed.

### 2.2 Commercial AI Product Distinction (Important Legal Caveat)
While Bible Rhema AI's embedded cache contains only 28 essential christological passages (5.6% of the 500-verse threshold), **a documented verse count does not by itself constitute legal clearance for commercial subscription distribution**.
- Modern AI SaaS platforms generating derived homiletical manuscripts and charging subscription fees (e.g. ₦15,000/month) fall under commercial software publishing.
- Crossway requires a formal commercial distribution contract for software applications that monetize access or bundle copyrighted Scripture within AI workflows.

### 2.3 Technical Safeguard: Public-Domain-Only Mode (`NEXT_PUBLIC_PUBLIC_DOMAIN_ONLY`)
To guarantee **zero copyright liability** for commercial production instances prior to final execution of a commercial agreement with Crossway:
- Setting the environment variable `NEXT_PUBLIC_PUBLIC_DOMAIN_ONLY=true` (or invoking `resolveScripturePassage(ref, version, { forcePublicDomain: true })`) completely bypasses the ESV cache and routes all scripture queries to the public-domain **World English Bible (WEB)** or **King James Version (KJV)**.
- In this mode, no copyrighted text is served, cached, or included in AI generation prompts.

---

## 3. Public Domain Translations (WEB & KJV)

### 3.1 World English Bible (WEB)
- **Copyright Status**: Dedicated directly to the public domain worldwide by Rainbow Missions, Inc.
- **Accuracy**: Direct, modern-English translation from the Hebrew Masoretic Text and Greek Byzantine/Majority Text.
- **Commercial Freedom**: May be freely copied, distributed, quoted, bundled into commercial software, and processed by LLMs without royalties, attribution agreements, or volume caps.

### 3.2 King James Version (KJV)
- **Copyright Status**: Public domain worldwide (except within the United Kingdom where Crown prerogative applies to commercial printing).
- **Commercial Freedom**: Freely usable across global cloud deployments.

---

## 4. API.Bible Terms of Service Compliance

Dynamic queries routed to the American Bible Society's API.Bible (`https://api.scripture.api.bible`):
1. Query only publicly accessible Bible IDs (`WEB: 9879dbb7cfe39e4d-04`, `KJV: de4e12af7f28f599-02`, `ASV: 06125adad2d5898a-01`).
2. Adhere to API rate limits (maximum 60 requests/minute enforced by `checkDistributedRateLimit`).
3. Retain provider attribution notes without masquerading alternate translations.
