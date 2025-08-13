from PIL import Image, ImageDraw, ImageFont
from config.settings import FONT_PATH


def overlay_caption(img: Image.Image, top: str, bottom: str) -> Image.Image:
    """
    Overlay meme-style text captions on an image.
    
    Args:
        img: PIL Image to overlay text on
        top: Top text caption
        bottom: Bottom text caption
        
    Returns:
        PIL Image with text overlaid
    """
    draw = ImageDraw.Draw(img)
    base_size = max(32, img.height // 8)  # Increased base size and better ratio

    def draw_center(text: str, y: int, is_top: bool = True):
        """Draw centered text with outline at specified y position."""
        if not text.strip():
            return
            
        # Start with base size and adjust down if needed
        font_size = base_size
        font = None
        
        # Find the largest font size that fits
        for size in range(font_size, 16, -4):  # Step down by 4 for faster iteration
            try:
                font = ImageFont.truetype(FONT_PATH, size)
                bbox = draw.textbbox((0, 0), text.upper(), font=font)
                text_width = bbox[2] - bbox[0]
                
                # Leave some margin (90% of image width)
                if text_width <= img.width * 0.9:
                    break
            except (OSError, IOError):
                # Fallback to default font if custom font fails
                font = ImageFont.load_default()
                break
        
        if font is None:
            font = ImageFont.load_default()
        
        # Calculate final y position
        bbox = draw.textbbox((0, 0), text.upper(), font=font)
        text_height = bbox[3] - bbox[1]
        
        if is_top:
            final_y = y + text_height // 2
        else:
            final_y = y - text_height // 2
        
        # Draw black outline by drawing text multiple times with offset
        for ox in (-2, -1, 0, 1, 2):
            for oy in (-2, -1, 0, 1, 2):
                if ox != 0 or oy != 0:  # Don't draw at center position
                    draw.text((img.width/2+ox, final_y+oy), text.upper(), anchor="mm",
                              font=font, fill="black")
        
        # Draw main text (white with black stroke)
        draw.text((img.width/2, final_y), text.upper(), anchor="mm",
                  font=font, fill="white", stroke_width=2, stroke_fill="black")
    
    # Better padding calculation - more generous margins
    pad = max(20, int(img.height*0.08))  # Minimum 20px padding, or 8% of height
    
    # Draw top text
    draw_center(top, pad, is_top=True)
    
    # Draw bottom text  
    draw_center(bottom, img.height - pad, is_top=False)
    
    return img
