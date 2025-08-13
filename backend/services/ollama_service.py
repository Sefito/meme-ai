import requests
import json
import re
from typing import Tuple
from config.settings import OLLAMA_HOST


def call_ollama(prompt: str) -> Tuple[str, str, str]:
    """
    Call Ollama API to generate meme content from user prompt.
    
    Args:
        prompt: User input prompt
        
    Returns:
        Tuple of (image_prompt, top_text, bottom_text)
    """
    # Expected response: JSON with imagePrompt, topText, bottomText
    system = (
        "Eres un escritor de memes virales. Dado un tema, responde JSON estricto con "
        '{"imagePrompt": "... (descripción visual para SSD-1B)", '
        '"topText": "texto arriba corto", "bottomText": "texto abajo corto"}.'
    )
    
    body = {
        "model": "llama3.1:8b",
        "prompt": f"<<SYS>>{system}<</SYS>>\nUsuario: {prompt}\nJSON:",
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": 256}
    }
    
    try:
        r = requests.post(f"{OLLAMA_HOST}/api/generate", json=body, timeout=120)
        r.raise_for_status()
        txt = r.json().get("response", "")
        m = re.search(r"\{.*\}", txt, re.S)
        
        print("\n== OLLAMA RESPONSE ==")
        if m:
            print(m.group(0))
            data = json.loads(m.group(0))
        else:
            print("No valid JSON found in response")
            data = {"imagePrompt": prompt, "topText": "", "bottomText": ""}
            
        return (
            data.get("imagePrompt", prompt),
            data.get("topText", ""),
            data.get("bottomText", "")
        )
        
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return prompt, "", ""
