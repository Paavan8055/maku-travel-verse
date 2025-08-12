# Accessibility Fixes Checklist (WCAG 2.2 AA)

- Landmarks & Headings
  - [ ] Single H1 per route; logical heading order (H2/H3)
  - [ ] Use semantic tags: header, nav, main, section, footer
- Keyboard & Focus
  - [ ] Ensure focus outlines are visible; no keyboard traps
  - [ ] All interactive controls reachable in logical order
- Forms
  - [ ] Inputs have associated labels; aria-describedby for errors
  - [ ] Announce validation errors and success via aria-live
- Components
  - [ ] Radix primitives given aria-label/aria-expanded/role where needed
  - [ ] Dialogs/modals trap focus; close on ESC with proper aria-modal
- Media & Color
  - [ ] Alt text for all images; 4.5:1 contrast minimum for text
  - [ ] Avoid color-only semantics; provide text or icons as well
