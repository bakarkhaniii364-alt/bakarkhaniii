---
trigger: always_on
---


no automated test unless I ask you to do it. 
no tilted box or window. 
no emojis. use vector icons. 
always use space mono font. come up with a proper font size arrangement for mobile and desktop layout both and put those in css and this rule.md file. 

### Space Mono Typography Hierarchy

| Level | CSS Custom Property | Desktop Size | Mobile Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Micro** | `--font-size-micro` | `10px` | `9px` | Smallest metadata details, system info |
| **Caption** | `--font-size-caption` | `12px` | `11px` | Card labels, secondary tags |
| **Small** | `--font-size-small` | `13px` | `12px` | Sub-items, status indicator texts |
| **Base** | `--font-size-base` | `15px` | `14px` | Standard body copy, inputs, dialog messages |
| **Large** | `--font-size-large` | `18px` | `16px` | Section titles, minor headers |
| **XL** | `--font-size-xl` | `22px` | `18px` | Sub-headings, phase status titles |
| **2XL** | `--font-size-2xl` | `26px` | `22px` | Intermediate page titles, modal greetings |
| **3XL** | `--font-size-3xl` | `32px` | `26px` | Primary screen headers |
| **4XL** | `--font-size-4xl` | `40px` | `32px` | Giant logo titles |

### Mobile Experience Rules

1. **Tap Highlight Reset**: Prevent visual lag by disabling the default browser tap highlight using `-webkit-tap-highlight-color: transparent` on all clickable nodes.
2. **Touch Targets (44px min)**: Ensure all critical touch targets (buttons, links, close icon triggers) are at least 44x44px to prevent accidental taps, especially on dense layouts.
3. **Prevent Keyboard Interference**: Optimize form elements on mobile by specifying `autocorrect="off"`, `autocapitalize="none"`, and `spellcheck="false"` for names or secret words to avoid annoying autocorrect overlays.
4. **Prevent Elastic Scrolling & Pull-To-Refresh**: Restrict mobile body scrolling bounce effects (`overscroll-behavior-y: none`) to keep the experience feeling native app-like.
5. **Disable User Selection on Static UI**: Apply `select-none` (using `user-select: none`) to headers, badges, buttons, and decorative text to prevent accidental selections when users tap rapidly.
6. **Account for Safe Area Insets**: Ensure layout headers and bottom controls leverage CSS env variables (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`) to prevent notch/home-indicator clipping on modern smartphones. 