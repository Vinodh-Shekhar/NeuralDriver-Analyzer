# Design System: FrameBench Analyzer

This document serves as the primary reference for agents building or refactoring the frontend of FrameBench Analyzer. It outlines the visual language, component patterns, and technical standards of the project.

---

## 1. Visual Identity & Brand

FrameBench Analyzer follows a high-performance, technical aesthetic inspired by NVIDIA's brand identity. It uses a dark-mode-first approach with high-contrast accent colors and monospace typography to emphasize data precision.

### 1.1 Core Colors
Defined in `tailwind.config.js` under the `nvidia` namespace.

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `nvidia-green` | `#76B900` | Primary brand color, success states, Dataset A metrics. |
| `nvidia-accent` | `#00ff9c` | Secondary accent, interactive elements, Dataset B metrics. |
| `nvidia-bg` | `#1a1a1a` | Main application background. |
| `nvidia-panel` | `#2b2b2b` | Card backgrounds, headers, surface areas. |
| `nvidia-panel-light` | `#353535` | Hover states for panels, secondary backgrounds. |
| `nvidia-text` | `#e6e6e6` | Primary body and heading text. |
| `nvidia-muted` | `#999999` | Secondary text, captions, inactive states. |
| `nvidia-border` | `#3a3a3a` | Default border color for panels and dividers. |
| `nvidia-danger` | `#ff4d4d` | Error states, performance regressions. |
| `nvidia-warning` | `#ffaa00` | Warning states, high variance indicators. |

### 1.2 Interactive Glows
Custom utility classes in `src/index.css` for adding depth to the UI.
- `.glow-green`: `box-shadow: 0 0 12px rgba(118, 185, 0, 0.3)`
- `.glow-accent`: `box-shadow: 0 0 12px rgba(0, 255, 156, 0.3)`
- `.glow-danger`: `box-shadow: 0 0 12px rgba(255, 77, 77, 0.3)`
- `.text-glow-green`: Subtle green text shadow for headers.

---

## 2. Typography

The design system uses a strictly monospace font family to ensure data alignment and a "terminal" feel.

- **Primary Font**: `JetBrains Mono` (via `@fontsource/jetbrains-mono`)
- **Fallback**: `Fira Code`, `ui-monospace`, `monospace`

### Text Styles
| Style | Tailwind Classes | Usage |
| :--- | :--- | :--- |
| **Heading 1** | `text-xl font-bold sm:text-2xl` | Main page/header title. |
| **Heading 2** | `font-mono text-sm font-medium` | Panel titles. |
| **Label** | `font-mono text-[10px] uppercase tracking-wider text-nvidia-muted` | Metric labels, metadata. |
| **Value** | `font-mono text-lg font-bold` | Primary data points. |
| **Code/Small** | `font-mono text-[11px]` | Version badges, file paths, raw data. |

---

## 3. Component Architecture

### 3.1 Panels & Cards
All container elements should follow this pattern for consistency:
```tsx
<div className="rounded-lg border border-nvidia-border bg-nvidia-panel p-4 animate-fade-in">
  {/* Content */}
</div>
```

### 3.2 Badges & Indicators
- **Version/Status Badge**: `rounded-full border border-nvidia-green/40 bg-nvidia-green/10 px-3 py-1 font-mono text-[11px] font-semibold text-nvidia-green`.
- **Driver Key Indicator**: Small `rounded` square (20x20px or 24x24px) with `bg-nvidia-green/20` or `bg-nvidia-accent/20`.

### 3.3 Progress Bars & Gauges
Used for GPU telemetry:
- **Track**: `h-1 overflow-hidden rounded-full bg-nvidia-bg`
- **Fill**: `h-full rounded-full bg-nvidia-green (or accent) transition-all duration-700`

### 3.4 Buttons
- **Primary**: Use `shimmer-btn` utility for an animated sweep effect.
- **Action**: `rounded border border-nvidia-border/50 bg-nvidia-bg/40 px-3 py-1.5 hover:bg-nvidia-panel-light transition-colors`.

---

## 4. Iconography

We use **Lucide React** for all icons.
- **Size**: Default to `h-4 w-4` for inline metrics, `h-5 w-5` for section headers.
- **Color**: Usually matches the accent color (`nvidia-green` or `nvidia-accent`).

---

## 5. Charts & Data Visualization

Charts are powered by **Recharts**.

### Configuration Defaults
- **Grid**: `<CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />`
- **X/Y Axis**: 
  - `tick={{ fill: '#999', fontSize: 10, fontFamily: 'monospace' }}`
  - `axisLine={{ stroke: '#3a3a3a' }}`
- **Tooltip**: Custom implementation using `bg-nvidia-panel` and `border-nvidia-border`.
- **Lines**: `strokeWidth={1.5}` with `dot={false}`.

---

## 6. Animations

Animations are defined in `tailwind.config.js` to provide a dynamic, "live" feel.

- `animate-fade-in`: Used for all panel entrances.
- `animate-pulse-glow`: Used for "live" status indicators.
- `animate-fan-spin`: 2s linear infinite rotation (used for GPU fan icons).
- `animate-slide-up`: Subtle entrance for modals or detail views.
- `shimmer-btn`: CSS pseudo-element animation for buttons.

---

## 7. Layout Principles

1.  **Grid System**: Use `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for main layouts.
2.  **Spacing**: Use standard Tailwind scale (e.g., `gap-4`, `p-4`, `mt-0.5`).
3.  **Responsive**: Mobile-first design. Use `sm:`, `md:`, `lg:` prefixes to adjust layout density.
4.  **Density**: High information density is preferred over whitespace, as this is a technical tool.

---

## 8. Coding Patterns

- **Type Safety**: All components should use TypeScript interfaces for props.
- **Logic Separation**: Complex data processing (like CSV parsing) should stay in `src/lib/` or inside a Web Worker (`csvParserWorker.ts`).
- **Conditional Rendering**: Use clear empty states (dashed borders with `nvidia-muted` text) when data is missing.
- **Tauri Integration**: Check for `isTauri` (checks for `window.__TAURI_INTERNALS__`) before calling native commands.

---

## 9. Common Utility Patterns

- **Conditional Colors**:
  ```tsx
  const accentClass = driverKey === 'A' ? 'text-nvidia-green' : 'text-nvidia-accent';
  const bgClass = driverKey === 'A' ? 'bg-nvidia-green/20' : 'bg-nvidia-accent/20';
  ```

- **Warning Thresholds**:
  - Frame Time Variance > 10ms² → `nvidia-warning`
  - Stutter Score > 3% → `nvidia-danger`
  - Pacing Stability < 85% → `nvidia-warning`
