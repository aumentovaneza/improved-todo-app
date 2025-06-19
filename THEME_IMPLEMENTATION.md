# Dual Theme Implementation - Light & Dark Mode

## Overview

This implementation provides custom color palettes for both light and dark modes in the Laravel + Inertia.js todo application with a fully functional theme toggle.

## Light Mode Color Palette

### Primary Colors

-   **Primary**: #60A5FA (Sky Blue) - Calm, cool blue for CTAs and main actions
-   **Secondary**: #FBCFE8 (Blossom Pink) - Light, soft pink for accents and highlights
-   **Accent**: #DDD6FE (Lavender Mist) - Muted purple highlight for special elements

### Light Theme Colors

-   **Background Primary**: #FDFDFD (Eggshell White) - Clean, bright main background
-   **Background Secondary**: #F9FAFB (Soft Pearl) - Subtle gray-white for cards and navigation
-   **Background Card**: #F9FAFB (Soft Pearl) - Card backgrounds with subtle contrast
-   **Background Hover**: #F1F5F9 - Hover states for interactive elements

### Text Colors (Light Mode)

-   **Text Primary**: #334155 (Slate Gray) - Dark blue-gray for excellent legibility
-   **Text Secondary**: #64748B (Cool Gray) - For helper text, labels, and secondary content
-   **Text Muted**: #94A3B8 - For placeholders and very subtle text

### Border Colors (Light Mode)

-   **Border**: #E2E8F0 (Light Cloud) - Very light gray for dividers and borders
-   **Border Light**: #F1F5F9 - Even lighter borders for subtle separation

## Dark Mode Color Palette

### Primary Colors

-   **Primary**: #3F51B5 (Indigo) - Main actions, buttons, and active states
-   **Secondary**: #5C6BC0 - Secondary actions and highlights
-   **Accent**: #7986CB - Accent elements and hover states

### Dark Theme Colors

-   **Background Primary**: #121212 - Main background color
-   **Background Secondary**: #1E1E2F - Cards, sidebars, and secondary surfaces
-   **Background Card**: #2D2D44 - Individual card backgrounds
-   **Background Hover**: #363650 - Hover states for interactive elements

### Text Colors (Dark Mode)

-   **Text Primary**: #FFFFFF - Primary text in dark mode
-   **Text Secondary**: #E0E0E0 - Secondary text and descriptions
-   **Text Muted**: #B0B0B0 - Muted text and placeholders

## Implementation Details

### 1. Tailwind Configuration (`tailwind.config.js`)

-   Added `darkMode: 'class'` to enable class-based dark mode
-   Extended color palette with Tailwind Blue for light mode primary colors
-   Maintained Indigo-based palette for dark mode
-   Added light and dark theme utility classes for consistent theming

### 2. Global Styles (`resources/css/app.css`)

-   Added base layer styles for smooth transitions between modes
-   Implemented custom scrollbar styling for both light and dark modes
-   Created adaptive component classes that work seamlessly in both themes
-   Added utility classes for consistent theming across the application

### 3. Theme Toggle Implementation (`TodoLayout.jsx`)

-   Enhanced theme state management with localStorage persistence
-   Added system preference detection as fallback
-   Improved toggle button with proper icons and smooth transitions
-   Applied comprehensive color schemes throughout the layout

### 4. Component Updates

-   **TextInput**: Adaptive color scheme with improved focus states
-   **PrimaryButton**: Tailwind Blue for light mode, Indigo for dark mode
-   **Modal**: Updated backdrop and background colors for both themes
-   **TodoLayout**: Comprehensive dual-theme color application
-   **Dashboard**: Example implementation using new utility classes

## Key Features

### Dual Theme Support

-   **Light Mode**: Clean, modern design with Sky Blue primary, soft pink accents, and lavender highlights
-   **Dark Mode**: Elegant deep indigo theme with excellent contrast
-   Seamless transitions between modes
-   Consistent component behavior across themes

### Persistent Theme Preference

-   Remembers user preference across browser sessions
-   Falls back to system preference if no stored preference exists
-   Smooth animations during theme transitions

### Responsive Design

-   All theme implementations maintain mobile responsiveness
-   Touch-friendly theme toggle button
-   Consistent experience across all screen sizes

### Accessibility

-   Proper color contrast ratios maintained in both modes
-   Screen reader friendly toggle button with descriptive labels
-   Keyboard navigation support maintained

## New Utility Classes

### Adaptive Classes (Work in Both Modes)

```css
.card                    /* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
/* Adaptive card styling */
.card-hover             /* Card with hover effects */
.btn-primary            /* Primary button (Blue/Indigo) */
.btn-secondary          /* Secondary button (Soft Blue/Medium Indigo) */
.btn-accent             /* Accent button (Yellow/Light Indigo) */
.input-primary          /* Adaptive input styling */
.text-adaptive-primary  /* Primary text color */
.text-adaptive-secondary /* Secondary text color */
.text-adaptive-muted    /* Muted text color */
.bg-adaptive-primary    /* Primary background */
.bg-adaptive-secondary  /* Secondary background */
.bg-adaptive-card; /* Card background */
```

### Theme-Specific Classes

**Light Mode:**

```css
.bg-light-primary       /* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
/* #FDFDFD (Eggshell White) */
.bg-light-secondary     /* #F9FAFB (Soft Pearl) */
.bg-light-card          /* #F9FAFB (Soft Pearl) */
.bg-light-hover         /* #F1F5F9 */
.text-light-primary     /* #334155 (Slate Gray) */
.text-light-secondary   /* #64748B (Cool Gray) */
.text-light-muted       /* #94A3B8 */
.border-light-border    /* #E2E8F0 (Light Cloud) */
.border-light-border-light; /* #F1F5F9 */
```

**Dark Mode:**

```css
.bg-dark-primary        /* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
/* #121212 */
.bg-dark-secondary      /* #1E1E2F */
.bg-dark-card           /* #2D2D44 */
.bg-dark-hover          /* #363650 */
.text-dark-primary      /* #FFFFFF */
.text-dark-secondary    /* #E0E0E0 */
.text-dark-muted        /* #B0B0B0 */
.border-dark-border; /* #404040 */
```

## Usage Examples

### Using Adaptive Classes

```jsx
// Card that adapts to current theme
<div className="card p-6">
    <h2 className="text-adaptive-primary text-xl font-semibold">
        Dashboard
    </h2>
    <p className="text-adaptive-secondary mt-2">
        Welcome to your task management dashboard
    </p>
    <button className="btn-primary mt-4">
        Get Started
    </button>
</div>

// Form with adaptive styling
<form className="space-y-4">
    <input
        className="input-primary w-full"
        placeholder="Enter task title..."
    />
    <div className="flex gap-3">
        <button className="btn-primary">Save</button>
        <button className="btn-secondary">Cancel</button>
    </div>
</form>
```

### Explicit Theme Styling

```jsx
// When you need explicit control
<div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4">
    <span className="text-light-primary dark:text-dark-primary font-medium">
        Theme-aware content
    </span>
</div>
```

## Testing the Implementation

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test Theme Toggle

1. Navigate to any page in the application
2. Look for the moon/sun icon in the top navigation bar
3. Click to toggle between light and dark modes
4. Refresh the page to verify theme persistence
5. Test system preference detection by clearing localStorage

### 3. Verify Color Schemes

-   **Light Mode**: Clean eggshell white backgrounds with Sky Blue accents, soft pink secondary elements, and lavender highlights
-   **Dark Mode**: Deep indigo backgrounds with custom indigo palette
-   **Transitions**: Smooth animations between theme changes
-   **Consistency**: All components should adapt properly

### 4. Check Responsive Behavior

-   Test theme toggle on mobile devices
-   Verify sidebar navigation colors in both modes
-   Ensure proper contrast ratios on all screen sizes

## Files Modified

### Configuration

-   `tailwind.config.js` - Dual-mode color palettes and utility classes
-   `resources/css/app.css` - Global styles and adaptive component classes

### Layout & Components

-   `resources/js/Layouts/TodoLayout.jsx` - Comprehensive theme implementation
-   `resources/js/Components/TextInput.jsx` - Adaptive input styling
-   `resources/js/Components/PrimaryButton.jsx` - Theme-aware button styling
-   `resources/js/Components/Modal.jsx` - Dual-theme modal styling

### Example Implementation

-   `resources/js/Pages/Dashboard.jsx` - Demonstrates new utility classes

## Color Comparison Table

| Element             | Light Mode                | Dark Mode               |
| ------------------- | ------------------------- | ----------------------- |
| **Primary Action**  | #60A5FA (Sky Blue)        | #3F51B5 (Indigo)        |
| **Secondary**       | #FBCFE8 (Blossom Pink)    | #5C6BC0 (Medium Indigo) |
| **Accent**          | #DDD6FE (Lavender Mist)   | #7986CB (Light Indigo)  |
| **Page Background** | #FDFDFD (Eggshell White)  | #121212 (Deep Black)    |
| **Card/Surface**    | #F9FAFB (Soft Pearl)      | #1E1E2F (Dark Indigo)   |
| **Primary Text**    | #334155 (Slate Gray)      | #FFFFFF (Pure White)    |
| **Secondary Text**  | #64748B (Cool Gray)       | #E0E0E0 (Light Gray)    |
| **Muted Text**      | #94A3B8 (Light Blue-Gray) | #B0B0B0 (Medium Gray)   |
| **Borders**         | #E2E8F0 (Light Cloud)     | #404040 (Dark Gray)     |

## Next Steps

To complete the theme implementation across all pages:

1. **Replace existing color classes** with adaptive utility classes
2. **Apply `.card` class** to existing card components
3. **Use `.btn-primary`, `.btn-secondary`, `.btn-accent`** for consistent button styling
4. **Update text colors** to use adaptive classes
5. **Test all interactive elements** in both themes

The foundation is now complete for a beautiful, consistent dual-theme experience throughout the application!
