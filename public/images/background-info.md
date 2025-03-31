# Background Image Setup

## File Locations

The background image for this app needs to be placed in **both** of these locations:
- `/public/background.jpg`
- `/public/images/background.jpg`

This ensures maximum compatibility across different environments and prevents issues with path resolution.

## How it Works

The Background component in `src/components/layout/Background.tsx` displays the image by:
1. Trying to load from `/images/background.jpg` first
2. Falling back to `/background.jpg` if needed
3. Using a proper stacking context with z-index to stay behind all content
4. Adding a subtle dark gradient overlay for better text readability

## Troubleshooting

If the background isn't visible:
- Make sure the image exists in both locations mentioned above
- Ensure no component is using `bg-black` or other solid background colors
- Check the browser console for any errors loading the image
- Verify that the Background component is properly included in the App component

## Customization

To change the background:
1. Replace both image files with your new image
2. Keep the same filename: `background.jpg`
3. Use high-quality images (at least 1920x1080px) for best results 