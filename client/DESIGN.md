# Design System: Citation Style Detailed Preview

**Project ID:** projects/4997510721725575250

## 1. Visual Theme & Atmosphere

The design embodies a **refined, scholarly functionalism**. It marries the utility of a technical tool with the typographic elegance of academic publishing. The overarching mood is **focused, crisp, and intellectual**, utilizing a serif typeface (Newsreader) throughout strictly "app" UI elements—a bold choice that elevates the interface from a standard utility to a premium research environment.

The atmosphere feels **grounded and authoritative**, with a high-contrast interaction between the soft, cool-toned application chrome and the stark, bright white "paper" surfaces used for previewing citations.

## 2. Color Palette & Roles

### Primary Brand

- **Royal Academic Blue** (`#135bec`) – Used for primary actions (buttons), key icons, and active states. It provides a vibrant, digital-native contrast to the otherwise muted palette.

### Surfaces & Backgrounds

- **Cool Mist White** (`#f6f6f8`) – The primary application background. A very light, cool gray that reduces glare compared to pure white.
- **Pure Paper White** (`#ffffff`) – Reserved for content cards and the "paper" preview area to simulate a physical document.
- **Obsidian Navy** (`#101622`) – Dark mode background foundation.

### Typography & Borders

- **Ink Black** (`#0d121b`) – Primary text color. Softer than pure black, reading like high-quality print ink.
- **Muted Steel Blue** (`#4c669a`) – Secondary text, metadata labels, and breadcrumb links.
- **Soft Border Gray** (`#e7ebf3`) – Layout dividers and card borders.
- **Interactable Border** (`#cfd7e7`) – Borders for buttons and interactive elements.

### Status & Accents

- **Tag Gray** (`#e7ebf3`) – Background for neutral category tags.
- **Alert Orange** (`bg-orange-100` / `#ffedd5`) – "Note" style indicators.
- **Success Green** (`bg-green-100` / `#dcfce7`) – "Bibliography" style indicators.

## 3. Typography Rules

**Primary Font Family:** **Newsreader** (Serif)
**Character:** A highly legible, contemporary serif that brings an academic/editorial voice to the entire UI.

### Hierarchy

- **Page Titles (H1):** Bold weight, 3xl size. Authoritative and editorial.
- **Section Headers (H2/H3):** Bold weight, xl or lg size. Distinct but integrated.
- **Body Text:** Text-sm for UI elements, slightly larger (text-lg) for the "paper" citation previews to mimic real document reading.
- **Labels:** Medium weight, text-xs or text-sm. Often used with uppercase tracking for section labels (e.g., "NOTE EXAMPLES").

## 4. Component Stylings

### Buttons

- **Primary Action:**
  - **Color:** Royal Academic Blue (`#135bec`) background, White text.
  - **Shape:** Rounded-lg (8px radius).
  - **Effect:** Subtle shadow (`shadow-md`) that deepens on hover (`shadow-lg`).
- **Secondary Action:**
  - **Color:** White background, Interactable Border (`#cfd7e7`), Ink Black text.
  - **Hover:** Slight gray tint (`hover:bg-gray-50`).

### Cards & Containers

- **App Panels:**
  - **Bg:** White (`bg-white`).
  - **Shape:** Rounded-xl (rounded corners, approx 12px).
  - **Border:** Soft Border Gray (`#e7ebf3`).
  - **Shadow:** Subtle shadow-sm.
- **The "Paper" Preview:**
  - **Bg:** White.
  - **Shape:** Rounded-md.
  - **Effect:** Realistic, deep shadow (`shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]`) to lift it off the background like a physical sheet. Includes a subtle top gradient overlay (`bg-gradient-to-b from-gray-50`) to suggest paper texture/depth.

### Chips & Badges

- **Shape:** Full rounded (`rounded-full`).
- **Padding:** px-3 py-1.
- **Typography:** Text-sm, Font-medium.
- **Colors:** Context-dependent pastels (Gray, Orange, Green) with matching colored text.

### Navigation & Header

- **Style:** Sticky, semi-transparent backdrop (`bg-white/80 backdrop-blur-md`).
- **Border:** Bottom border in Soft Border Gray (`#e7ebf3`).
- **Content:** Clean separation between the brand/search (left) and navigation links (right).

## 5. Layout Principles

### Grid & Structure

- **Max Width:** Restricted to `1440px` for optimal readability.
- **Columns:** Standard 12-column grid.
  - **Sidebar:** 4 columns (Metadata, Actions).
  - **Main:** 8 columns (Preview Area).
- **Spacing:** Generous gaps (`gap-8`) between major layout zones.

### Visual Metaphor

- **"Desk & Paper":** The UI mimics a researcher's desk. The gray background acts as the desk surface, with panels and the main "paper" preview sitting on top of it, distinguished by borders and shadows.
