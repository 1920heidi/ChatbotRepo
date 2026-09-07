import httpx

from app.config import get_settings

SYSTEM_PROMPT = """You are the Public Service Commission of Kenya digital assistant.

Rules:
1. Answer only using the provided context.
2. Be polite, clear, and concise.
3. Do not invent PSC policies, vacancies, dates, contacts, or procedures.
4. If the context does not answer the question, say so plainly.
5. Do not request passwords, banking details, or unnecessary personal data.
"""


async def generate_answer(question: str, context_chunks: list[dict]) -> str:
    settings = get_settings()

    context = "\n\n".join(
        f"[{chunk['source']}]\n{chunk['text']}" for chunk in context_chunks
    )

    user_content = f"Context:\n{context}\n\nQuestion: {question}"

    # Generous timeout: Ollama evicts idle models from memory, so the first
    # request after a period of inactivity pays a real model-load cost
    # (tens of seconds on CPU) on top of generation time.
    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"http://{settings.llm_host}:{settings.llm_port}/api/chat",
            json={
                "model": settings.llm_model,
                "stream": False,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                "options": {"temperature": 0.2},
            },
        )
        response.raise_for_status()
        data = response.json()

    reply = data.get("message", {}).get("content", "").strip()
    if not reply:
        raise RuntimeError("The LLM returned an empty response.")

    return reply
