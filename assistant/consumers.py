import asyncio
import os
import re

import ptyprocess
from channels.generic.websocket import AsyncWebsocketConsumer
from dotenv import load_dotenv

load_dotenv()  # ensure .env is loaded when the consumer module is imported

# Strip ANSI escape sequences before sending to the browser
_ANSI_RE = re.compile(r'\x1B\[[0-?]*[ -/]*[@-~]|\x1B[()][AB012]|\x1B=|\x1B>')


def _strip_ansi(text: str) -> str:
    return _ANSI_RE.sub('', text)


# ── Shell to launch ────────────────────────────────────────────────────────────────
# Set GANGAFLOW_SHELL in .env to launch a different shell, e.g.:
#   GANGAFLOW_SHELL=/path/to/.venv/bin/ganga
DEFAULT_SHELL = 'bash'


class TerminalConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer that bridges the browser terminal pane to a real PTY.

    Browser → WS text  →  PTY stdin
    PTY stdout         →  WS text  →  Browser
    """

    async def connect(self):
        await self.accept()
        self.running = False
        self._pty = None

        # Read shell at connection time so .env changes apply after a server restart
        shell = os.environ.get('GANGAFLOW_SHELL', DEFAULT_SHELL)

        try:
            # Spawn the shell inside a PTY
            self._pty = ptyprocess.PtyProcess.spawn(
                [shell],
                dimensions=(24, 140),   # rows × cols
            )
            self.running = True
        except Exception as exc:
            await self.send(text_data=f'[GangaFlow] Failed to start shell: {exc}\r\n')
            await self.close()
            return

        # Start the background reader
        asyncio.ensure_future(self._read_loop())

        await self.send(
            text_data=f'[GangaFlow] Shell started ({shell}). '
                       'Type commands below or ask GangaBot.\r\n'
        )

    async def disconnect(self, close_code):
        self.running = False
        if self._pty and self._pty.isalive():
            try:
                self._pty.terminate(force=True)
            except Exception:
                pass

    async def receive(self, text_data=None, bytes_data=None):
        """Forward browser keystrokes / commands to the PTY."""
        if not self._pty or not self._pty.isalive():
            return
        try:
            if text_data is not None:
                self._pty.write(text_data.encode('utf-8', errors='replace'))
            elif bytes_data is not None:
                self._pty.write(bytes_data)
        except EOFError:
            pass

    # ── Private ───────────────────────────────────────────────────────────────

    async def _read_loop(self):
        """Continuously read PTY output and forward to the WebSocket."""
        loop = asyncio.get_event_loop()
        while self.running:
            try:
                raw = await loop.run_in_executor(None, self._pty.read, 4096)
                text = raw.decode('utf-8', errors='replace')
                text = _strip_ansi(text)
                await self.send(text_data=text)
            except EOFError:
                # Shell exited normally
                self.running = False
                try:
                    await self.send(text_data='\r\n[GangaFlow] Shell session ended.\r\n')
                    await self.close()
                except Exception:
                    pass
                break
            except Exception:
                self.running = False
                break
