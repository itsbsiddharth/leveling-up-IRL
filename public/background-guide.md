# Background Image Guide

## Simplified Background Setup

The background image for this application should be placed in:
- `/public/background.jpg`

This is the only location needed. The image will be accessible at the URL path `/background.jpg` in the browser.

## How It Works

The Background component (`src/components/layout/Background.tsx`) loads the image from this single location. This simplifies maintenance and makes it easier to change the background.

## Changing the Background Image

To change the background:

1. Create your new background image
2. Name it `background.jpg`
3. Place it in the `public` folder (replacing the existing file)
4. That's it! No need to duplicate the image in multiple locations.

## Recommendations

- Use high-quality images (1920x1080px or higher)
- JPEG format is recommended for photos
- Keep file size reasonable (less than 1MB if possible) for better loading performance
- Use images with good contrast to ensure UI elements remain visible

## Troubleshooting

If the background isn't visible:
- Verify the image exists at `/public/background.jpg`
- Check browser console for any loading errors
- Ensure the path in the Background component matches the file location 