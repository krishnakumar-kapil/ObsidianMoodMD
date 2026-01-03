# Product Roadmap & Technical Plan

## 1. UI Refactoring: Slider & Emotions
**Goal:** Move away from simple emojis to a more granular, Apple-Health-style interface.

- **Mood Slider:**
  - Replace the 5-button emoji row with a continuous or stepped slider (e.g., 1-10 or 1-100).
  - Visuals: a gradient bar (Red -> Green/Blue) or a simple segmented control.
  - *Context:* "does not need to take up the whole screen".

- **Emotions & Feelings:**
  - Add a multi-select "Chip" interface below the mood slider.
  - Categories: *Positive* (Happy, Excited, Calm), *Negative* (Anxious, Sad, Frustrated), *Physical* (Tired, Energetic).
  - Users can tap to toggle these tags.

## 2. In-Note Rendering
**Goal:** Render the tracker directly inside the daily note, rather than in a sidebar.

- **Mechanism:** Use Obsidian's `MarkdownPostProcessor`.
- **Usage:** User inserts a code block:
  ```
  ```mood-tracker
  ```
- **Behavior:** The plugin replaces this block with the React UI components.

## 3. Data Storage Strategy
**Current:** YAML Frontmatter (Properties).
**Request:** "Save mood to another section or propose alternatives."

### Proposed Solution: "Human-Readable Log Section"
Instead of hidden metadata, we will append a readable log section to the note. This keeps the data portable and readable even if the plugin is disabled.

**Format Example:**
```markdown
## Daily Log
**Time**: 09:30 AM
**Mood**: 7/10
**Feelings**: #Anxious, #Motivated
**Workout**: Running (30 mins)
**Gratitude**: I am grateful for the sunny weather today.
```

**Why this approach?**
1.  **Portability:** It's just text.
2.  **Searchability:** Standard Obsidian search works on it.
3.  **Parsing:** The plugin will read this section to pre-fill the UI. If the user edits the text manually, the UI updates.

## 4. Implementation Plan (Todo)
- [ ] **Step 1:** Create `MoodSlider` component (Range input with CSS variables).
- [ ] **Step 2:** Create `EmotionSelector` component (Flex-wrapped list of pill-shaped buttons).
- [ ] **Step 3:** Update `DataService`:
    -   Remove Frontmatter logic.
    -   Add logic to parse/write a `## Daily Log` section (or custom header).
- [ ] **Step 4:** Register `registerMarkdownCodeBlockProcessor` in `main.ts` to mount the React app inside the note.
