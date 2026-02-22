from django.urls import path
from assistant.views import chat, chat_history

urlpatterns = [
    path("chat/",                          chat,         name="chat"),
    path("chat/<str:session_id>/history/", chat_history, name="chat-history"),
]
