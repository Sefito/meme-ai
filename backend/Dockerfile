FROM pytorch/pytorch:2.3.1-cuda12.1-cudnn8-runtime

WORKDIR /app

# copia reqs del contexto ./backend
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000