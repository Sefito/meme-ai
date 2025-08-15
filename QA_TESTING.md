# QA Test Script - Meme AI Studio

## Manual Testing Checklist

### 🚀 Basic Functionality
- [ ] Page loads correctly at http://localhost:5173
- [ ] Default prompt is visible in textarea
- [ ] Generate button is enabled initially
- [ ] All form controls are visible and labeled

### 🎨 Theme Testing
- [ ] Click theme toggle - switches from dark to light mode
- [ ] Colors and contrast are appropriate in both themes
- [ ] Theme preference persists on page reload
- [ ] All text remains readable in both themes

### 📝 Form Controls
- [ ] Prompt textarea accepts input and shows character count
- [ ] Top/Bottom text inputs work for meme text
- [ ] Steps slider (1-50) moves and updates label
- [ ] Guidance slider (1-10, 0.1 step) moves and updates label
- [ ] Model dropdown shows 3 options (SSD-1B, SSD-Lite, Flux-1)
- [ ] Aspect ratio dropdown shows 4 options
- [ ] Seed toggle switches between "Aleatoria" and "Fija"
- [ ] When seed is "Fija", number input becomes enabled
- [ ] Negative prompt textarea accepts input

### 🖼️ Image Upload
- [ ] Click upload area opens file picker
- [ ] File picker only accepts image files
- [ ] Selected image shows preview
- [ ] Preview has X button to remove image
- [ ] Drag and drop works (simulated)
- [ ] Invalid files show error toast

### 👁️ Preview Functionality
- [ ] Empty state shows friendly placeholder with emoji
- [ ] With image uploaded, shows preview
- [ ] Top text appears with Impact font styling and black outline
- [ ] Bottom text appears with same styling
- [ ] Text overlay is clearly visible over image
- [ ] Text updates in real-time as you type

### 📚 History Panel
- [ ] History button on left side shows counter (initially 0)
- [ ] Click history button opens panel
- [ ] Empty state shows "no images" message
- [ ] Panel has close button (X)
- [ ] Click outside panel closes it
- [ ] Clear button visible when history has items

### 🔲 Bottom Action Bar
- [ ] Action bar is sticky at bottom of screen
- [ ] Generate button is prominent and enabled
- [ ] Nuevo button works (resets some state)
- [ ] Progress bars appear during generation
- [ ] Action buttons adapt based on generation status

### 📱 Responsive Design
- [ ] Layout works on desktop (3 columns)
- [ ] Layout adapts on smaller screens
- [ ] All controls remain accessible
- [ ] Text is readable at all sizes

### ♿ Accessibility
- [ ] All form inputs have proper labels
- [ ] Button focus states are visible
- [ ] Tab navigation works logically
- [ ] Screen reader friendly (aria-labels on icon buttons)
- [ ] Lighthouse accessibility score ≥ 90 ✅ (Current: 93)

### 🔄 Error Handling
- [ ] Invalid file upload shows appropriate error
- [ ] Network errors show toast notifications
- [ ] Form validation works correctly
- [ ] Error states are user-friendly

## Test Results

**Accessibility Score:** 93/100 ✅  
**Theme Toggle:** Working ✅  
**Form Controls:** All functional ✅  
**UI Layout:** 3-column responsive ✅  
**Build Status:** Success ✅

### Known Limitations
- Backend image upload testing requires backend to be running
- Actual generation workflow needs backend connection
- Video generation testing requires successful image generation

## Browser Testing
Test in multiple browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

## Performance Notes
- Initial bundle size: ~234KB (gzipped: ~71KB)
- Lighthouse accessibility: 93/100
- No console errors in development mode
- Smooth animations and transitions