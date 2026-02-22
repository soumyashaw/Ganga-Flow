import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from assistant.models import ChatSession, ChatMessage
from assistant.llm.chat import GangaBot


@csrf_exempt
@require_http_methods(["POST"])
def chat(request):
    """
    POST /api/chat/
    Body:  { "message": "...", "session_id": "<uuid>" (optional) }
    Reply: { "reply": "...", "session_id": "<uuid>" }
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    user_message = body.get("message", "").strip()
    if not user_message:
        return JsonResponse({"error": "'message' field is required."}, status=400)

    session_id = body.get("session_id")

    # ── Get or create the session ────────────────────────────────────────────
    if session_id:
        session = ChatSession.objects.filter(id=session_id).first()
        if not session:
            return JsonResponse({"error": "Session not found."}, status=404)
    else:
        session = ChatSession.objects.create()

    # ── Rebuild GangaBot history from the database ───────────────────────────
    bot = GangaBot()
    for msg in session.messages.exclude(role="system"):
        bot.history.append({"role": msg.role, "content": msg.content})

    # ── Persist user message ─────────────────────────────────────────────────
    ChatMessage.objects.create(session=session, role="user", content=user_message)

    # ── Call the LLM ─────────────────────────────────────────────────────────
    try:
        reply = bot.send(user_message)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=502)

    # ── Persist assistant reply ──────────────────────────────────────────────
    ChatMessage.objects.create(session=session, role="assistant", content=reply)

    return JsonResponse({"reply": reply, "session_id": str(session.id)})


@require_http_methods(["GET"])
def chat_history(request, session_id):
    """
    GET /api/chat/<session_id>/history/
    Returns all messages in a session (for reloading chat on page refresh).
    """
    session = ChatSession.objects.filter(id=session_id).first()
    if not session:
        return JsonResponse({"error": "Session not found."}, status=404)

    messages = [
        {"role": m.role, "content": m.content, "timestamp": m.timestamp.isoformat()}
        for m in session.messages.exclude(role="system")
    ]
    return JsonResponse({"session_id": session_id, "messages": messages})
