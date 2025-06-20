# Pomodoro Timer Features

## Overview

A comprehensive Pomodoro timer has been integrated into the Laravel + React todo application. The timer provides a distraction-free way to manage work sessions using the Pomodoro Technique.

## Features Implemented

### 1. Floating Pomodoro Widget

-   **Location**: Bottom-right corner of the screen, always visible
-   **States**:
    -   Collapsed: Shows timer icon with color-coded session type
    -   Expanded: Full timer interface with controls
-   **Visual Indicators**:
    -   Red: Work session (25 minutes)
    -   Green: Short break (5 minutes)
    -   Blue: Long break (15 minutes)
    -   Pulsing dot: Timer is running
    -   Yellow dot: Timer is paused

### 2. Focus Mode

-   **Activation**: Click "Focus Mode" button in widget or start timer with focus
-   **Interface**: Fullscreen timer with gradient background
-   **Features**:
    -   Large countdown display
    -   Circular progress indicator
    -   Session type and motivational text
    -   Keyboard shortcut (ESC to exit)
    -   Cancel button in top-right corner

### 3. Document Title Updates

-   **Running Timer**: `(MM:SS) Session Type - Improved Todo App`
-   **Stopped Timer**: `Improved Todo App`
-   **Real-time Updates**: Title updates every second during active sessions

### 4. React Context State Management

-   **PomodoroContext**: Centralized state management
-   **State Persistence**: Session count and current session type saved to localStorage
-   **State Properties**:
    -   Timer state (idle, running, paused, break)
    -   Time remaining
    -   Current session type
    -   Sessions completed
    -   Focus mode status
    -   Widget expansion state

### 5. Timer Logic

-   **Work Sessions**: 25 minutes
-   **Short Breaks**: 5 minutes (after 1st, 2nd, 3rd work session)
-   **Long Breaks**: 15 minutes (after 4th work session)
-   **Auto-progression**: Automatically switches between work and break sessions
-   **Session Tracking**: Counts completed work sessions

### 6. Audio Notifications

-   **Timer Completion**: Plays a gentle beep sound when timer ends
-   **Browser Compatibility**: Uses Web Audio API with fallback handling
-   **Non-intrusive**: Sound plays only on session completion

### 7. Enhanced UX Features

-   **Responsive Design**: Works on desktop and mobile devices
-   **Dark Mode Support**: Integrates with existing theme system
-   **Smooth Animations**: Hover effects, transitions, and progress animations
-   **Keyboard Shortcuts**: ESC to exit focus mode
-   **Visual Feedback**: Progress bars, color coding, and status indicators

## File Structure

```
resources/js/Components/Pomodoro/
├── PomodoroContext.jsx      # State management and timer logic
├── FloatingPomodoroWidget.jsx # Bottom-right floating widget
├── FocusMode.jsx            # Fullscreen focus interface
└── index.js                 # Component exports
```

## Integration Points

### Layouts

-   **AuthenticatedLayout**: Includes Pomodoro components for authenticated users
-   **TodoLayout**: Includes Pomodoro components for todo-specific pages

### App Entry Point

-   **app.jsx**: Wraps entire application with PomodoroProvider

## Usage Instructions

### Basic Usage

1. Look for the floating timer button in the bottom-right corner
2. Click to expand and see timer controls
3. Click "Start" to begin a 25-minute work session
4. Use "Focus Mode" for distraction-free sessions

### Focus Mode

1. Click "Focus Mode" button in the widget
2. Timer takes over the entire screen
3. Press ESC or click the X to exit focus mode
4. Timer continues running in the background

### Session Flow

1. Start with a 25-minute work session
2. Take a 5-minute break
3. Repeat for 4 work sessions
4. Take a 15-minute long break
5. Cycle repeats automatically

## Technical Implementation

### State Management

-   Uses React's `useReducer` for complex state logic
-   Context provider wraps entire application
-   localStorage persistence for session data

### Timer Mechanism

-   `setInterval` for countdown functionality
-   Cleanup on component unmount
-   Automatic state transitions

### Audio Implementation

-   Web Audio API for cross-browser compatibility
-   Graceful fallback if audio is blocked
-   Simple sine wave beep sound

### Styling

-   TailwindCSS for all styling
-   Responsive design patterns
-   Dark mode compatibility
-   Smooth transitions and animations

## Browser Compatibility

-   **Modern Browsers**: Full feature support
-   **Audio**: Requires user interaction for audio playback (browser security)
-   **localStorage**: Required for session persistence
-   **Web Audio API**: Fallback handling for unsupported browsers

## Future Enhancements

Potential improvements that could be added:

-   Custom timer durations
-   Different notification sounds
-   Pomodoro statistics and analytics
-   Integration with task management
-   Notification API for browser notifications
-   Keyboard shortcuts for timer control
