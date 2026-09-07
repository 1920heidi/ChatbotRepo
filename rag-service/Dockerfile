FROM python:3.12-slim

WORKDIR /service

COPY requirements.txt .
# CPU-only torch build first — the default PyPI wheel bundles CUDA and is
# several GB, which times out on a slow connection for no benefit (these
# containers have no GPU).
RUN pip install --no-cache-dir --default-timeout=120 torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir --default-timeout=120 -r requirements.txt

COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
