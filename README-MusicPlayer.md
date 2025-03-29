# GrindIRL Music Player

## Overview
The GrindIRL Music Player is a cyberpunk-styled music player component that provides background music for the application. It features a responsive design, audio visualization, and a sleek UI that matches the overall cyberpunk aesthetic of the app.

## Features
- **Audio Playback**: Uses Howler.js for robust cross-browser audio playback
- **Track Selection**: Dropdown menu to select from predefined tracks
- **Playback Controls**: Play/pause, previous/next track, and loop mode
- **Volume Control**: Adjustable volume with mute/unmute functionality
- **Progress Bar**: Interactive progress bar for scrubbing through tracks
- **Visualizer**: Dynamic audio visualizer with cyberpunk styling
- **Responsive Design**: Works well on both desktop and mobile devices
- **Minimized Mode**: Can be collapsed to a floating button to save screen space

## Implementation
- The music player is implemented as a standalone React component in `src/components/ui/MusicPlayer.tsx`
- It's integrated globally in the application through `App.tsx`
- Each track has a unique color theme that affects the UI elements
- The visualizer uses a canvas-based implementation for performance

## Available Tracks
1. DARK ARIA LV2
2. Snake OST Cover
3. Solo Leveling - ReawakeR
4. Solo Leveling - Level
5. Solo Leveling S2 Ending

## Technical Details
- **Audio Engine**: Howler.js
- **UI Framework**: React with Tailwind CSS
- **Icons**: Lucide React
- **Animation**: Custom canvas-based visualization
- **State Management**: React hooks (useState, useEffect, useRef)

## Usage
The music player appears as a floating button in the bottom right corner of the screen. Click it to expand the full player interface. From there, you can:

1. Select a track from the dropdown menu
2. Play/pause the current track
3. Navigate between tracks
4. Adjust volume
5. Toggle loop mode
6. Scrub through the track using the progress bar

## Troubleshooting
If you encounter issues:
- Make sure music files exist in the `/public/music/` directory
- Check browser console for any errors
- Verify that Howler.js is properly installed

## Future Improvements
- Add audio spectrum analysis for more accurate visualizations
- Implement playlist functionality
- Add fade in/out transitions between tracks
- Support for user-uploaded tracks 