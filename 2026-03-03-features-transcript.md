# Features Brainstorm — March 3, 2026

## Raw Input (Voice-to-Text)

> This is the loomwork Framework features. The table contents thing on the page. The controls, as we know, shouldn't be within the little D-pad bar on the bottom. That little D-pad bar on the bottom should be movable, too. You should be able to drag that anywhere on the screen if you want it. I don't know about the table contents part. Maybe it can live in there, but let's also put it, like, let's give it three ways of being, right? So, one, you can show it. Table two, it becomes this collapsed list of just numbers so that you know that there is table content that you can go for them. And the third one is to be totally collapsed. So three features.
>
> You also need a new page type. A new page type is going to be akin to a blog. It's going to have a table contents-like thing, but that's going to be scrollable. It's all going to be on one page. It's all going to fit within the visible view panel, either on mobile or desktop. On desktop, the experience is going to be basically like title listings on the left that you can choose from. And then when you choose one on the right, it becomes this almost like a PowerPoint slide slash blog thing. I'm not quite sure yet. And if it goes beyond the height of the page, it itself is scrollable for now. Let's see how that works.
>
> But basically, it's going to take up a lot of the width of the viewable page, especially on desktop. It's going to be long form stuff. It's going to be the blog stuff. It's gonna be like deep dive on why side fire 2 was a failure and what we learned from it and why the time invested in that was such a good thing. So it's gonna have that type of stuff there and that's gonna be in addition to the page either page type or the content of the like repo chickens that have been doing the public-private stuff. So, okay, that's cool. I think it was more there, but I got lost.

---

## Deciphering Notes

The input was clearly voice-to-text with some garbled phrases. Here's what I interpreted and why:

| Garbled Phrase | Interpretation | Reasoning |
|----------------|---------------|-----------|
| **"Table two"** | **State two** (the second TOC display mode) | In context, the speaker is listing three states of the TOC: "one, you can show it… *table two*, it becomes this collapsed list… the third one is totally collapsed." "Table two" is the voice engine mishearing "state two" or simply "two" while the word "table" bled over from the surrounding TOC discussion. |
| **"side fire 2"** | **Campfire 2** | The project has a `campfire.css` theme in `public/themes/`, indicating "Campfire" is a known project name within this ecosystem. "Side fire" is a common voice-to-text corruption of "Campfire" — the hard 'C' gets dropped and the syllable stress shifts. |
| **"repo chickens"** | **Repo changes** (or "repo content") | The speaker is referring to the existing content management workflow — pages and posts committed to the repo with public/private visibility. "Chickens" is a voice-to-text mangling of "changes." The phrase "that have been doing the public-private stuff" confirms they're talking about the repo-based content pipeline. |
| **"D-pad bar"** | The **floating bottom navigation bar** | Not garbled — this is the speaker's nickname for the small floating control bar at the bottom of the screen. Its directional-pad-like appearance earned the name. |

---

## Structured Output

See [FEATURES.md](FEATURES.md) for the full structured version. Summary:

### 1. Table of Contents — Three Display Modes

| Mode | Behavior |
|------|----------|
| **Expanded** | Full TOC visible with heading text and links |
| **Collapsed (numbered)** | Minimal — just section numbers shown as jump targets |
| **Hidden** | Completely collapsed, not visible |

### 2. Navigation Bar (D-Pad) Improvements

- **2a.** Reader Controls should be removed from the D-pad — it's for navigation only.
- **2b.** The D-pad should be **draggable** to any position on screen.

### 3. New Page Type — Long-Form / Blog View

- **Desktop:** Split-panel — scrollable title list on the left, wide presentation-style content on the right.
- **Mobile:** Single column adaptation.
- All content on one page, viewport-fitted, with per-article scroll overflow.
- For deep dives, retrospectives, essays (e.g., "Why Campfire 2 failed and what we learned").
- Additive to existing page types and the repo-managed content workflow.
