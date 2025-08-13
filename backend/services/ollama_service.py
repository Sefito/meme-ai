import requests
import json
import logging
from typing import Tuple, Optional, Dict, Any
from config.settings import OLLAMA_HOST

# Configure logging
logger = logging.getLogger(__name__)


class OllamaError(Exception):
    """Custom exception for Ollama API errors."""
    pass


def call_ollama(
    prompt: str, 
    model: str = "llama3.1:8b",
    temperature: float = 0.7,
    max_tokens: int = 256,
    timeout: int = 120
) -> Tuple[str, str, str]:
    """
    Call Ollama API to generate meme content from user prompt using JSON mode.
    
    Args:
        prompt: User input prompt for meme generation
        model: Ollama model to use (default: llama3.1:8b)
        temperature: Sampling temperature (0.0-1.0, default: 0.7)
        max_tokens: Maximum tokens to generate (default: 256)
        timeout: Request timeout in seconds (default: 120)
        
    Returns:
        Tuple of (image_prompt, top_text, bottom_text)
        
    Raises:
        OllamaError: If the API call fails or returns invalid data
    """
    # System message optimized for JSON mode
    system_message = (
        "You are an expert meme writer. Given a topic, generate content for a meme "
        "and respond ONLY with a valid JSON object containing exactly these fields: "
        '"imagePrompt" (detailed visual description to generate the image), '
        '"topText" (top text of the meme, short and impactful), '
        '"bottomText" (bottom text of the meme, short and funny). '
        "Respond only with JSON, no additional text."
    )
    
    # Build request body with JSON mode enabled
    request_body = {
        "model": model,
        "prompt": f"System: {system_message}\n\nUser: {prompt}\n\nJSON:",
        "format": "json",  # Enable JSON mode for structured output
        "stream": False,
        "system": system_message,  # Use system parameter for better prompt handling
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
            "stop": ["\n\n", "User:", "System:"],  # Stop tokens to prevent extra text
        }
    }
    
    try:
        logger.info(f"Calling Ollama API with model: {model}, prompt length: {len(prompt)}")
        
        # Make API request
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate", 
            json=request_body, 
            timeout=timeout,
            headers={"Content-Type": "application/json"}
        )
        
        # Check HTTP status
        response.raise_for_status()
        
        # Parse response
        response_data = response.json()
        logger.debug(f"Raw Ollama response: {response_data}")
        
        # Extract the generated text
        generated_text = response_data.get("response", "").strip()
        
        if not generated_text:
            raise OllamaError("Empty response from Ollama API")
        
        # Parse JSON response (should be clean JSON due to format="json")
        try:
            meme_data = json.loads(generated_text)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON response: {generated_text}")
            # Fallback: try to extract JSON from response
            meme_data = _extract_json_fallback(generated_text, prompt)
        
        # Validate required fields
        image_prompt = meme_data.get("imagePrompt", "").strip()
        top_text = meme_data.get("topText", "").strip()
        bottom_text = meme_data.get("bottomText", "").strip()
        
        # Use original prompt as fallback for image_prompt
        if not image_prompt:
            image_prompt = prompt
            logger.warning("No imagePrompt in response, using original prompt")
        
        logger.info(f"Successfully generated meme content - Image: {len(image_prompt)} chars, "
                   f"Top: '{top_text}', Bottom: '{bottom_text}'")
        
        return image_prompt, top_text, bottom_text
        
    except requests.exceptions.RequestException as e:
        error_msg = f"HTTP request failed: {e}"
        logger.error(error_msg)
        raise OllamaError(error_msg) from e
        
    except json.JSONDecodeError as e:
        error_msg = f"Invalid JSON in API response: {e}"
        logger.error(error_msg)
        raise OllamaError(error_msg) from e
        
    except Exception as e:
        error_msg = f"Unexpected error calling Ollama: {e}"
        logger.error(error_msg)
        # Return fallback values instead of raising for better UX
        return prompt, "", ""


def _extract_json_fallback(text: str, original_prompt: str) -> Dict[str, str]:
    """
    Fallback method to extract JSON from malformed response text.
    
    Args:
        text: Response text that may contain JSON
        original_prompt: Original user prompt as fallback
        
    Returns:
        Dictionary with meme data
    """
    import re
    
    logger.info("Attempting fallback JSON extraction")
    
    # Try to find JSON object in the text
    json_match = re.search(r'\{[^{}]*"imagePrompt"[^{}]*\}', text, re.DOTALL | re.IGNORECASE)
    
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass
    
    # If no valid JSON found, return fallback structure
    logger.warning("Fallback JSON extraction failed, using defaults")
    return {
        "imagePrompt": original_prompt,
        "topText": "",
        "bottomText": ""
    }


def health_check() -> bool:
    """
    Check if Ollama service is available and responsive.
    
    Returns:
        True if service is healthy, False otherwise
    """
    try:
        response = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=10)
        response.raise_for_status()
        logger.info("Ollama health check passed")
        return True
    except Exception as e:
        logger.error(f"Ollama health check failed: {e}")
        return False


def list_available_models() -> Optional[list]:
    """
    Get list of available models from Ollama.
    
    Returns:
        List of model names or None if request fails
    """
    try:
        response = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=10)
        response.raise_for_status()
        data = response.json()
        models = [model.get("name", "") for model in data.get("models", [])]
        logger.info(f"Available models: {models}")
        return models
    except Exception as e:
        logger.error(f"Failed to get available models: {e}")
        return None
