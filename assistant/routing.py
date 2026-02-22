from django.urls import path
from assistant.consumers import TerminalConsumer

websocket_urlpatterns = [
    path('ws/terminal/', TerminalConsumer.as_asgi()),
]
