import html
import hmac
import json
import os
import re
import secrets
import threading
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer


ROOT = Path(__file__).resolve().parent
DATA = Path(os.environ.get("PENTELL_DATA_DIR", "/data"))
DATA.mkdir(parents=True, exist_ok=True)
CONTENT_PATH = DATA / "pentell-content.json"
PUBLISHED_PDF = DATA / "canaryNorth_v8_folio.pdf"
ORIGINAL_PDF = ROOT / "blog" / "canaryNorth_v8_folio.pdf"
EDITOR_HTML = ROOT / "edit" / "pentell" / "index.html"
SESSION_COOKIE = "pentell_owner"
SESSIONS: dict[str, float] = {}
LOCK = threading.Lock()

DEFAULT_TITLE = "How me, my cat, a Harry Potter-inspired invisibility cloak, a security guard, and Codex built a Red-Team Lab in 12 hours"
DEFAULT_DEK = "How one night of AI security curiosity became contextSeal, penTell, Benji7Lives, canaryNorth, and a defensible evidence trail."


def clean_html(value: str) -> str:
    value = value or ""
    value = re.sub(r"<script\b[^>]*>.*?</script>", "", value, flags=re.I | re.S)
    value = re.sub(r"<style\b[^>]*>.*?</style>", "", value, flags=re.I | re.S)
    value = re.sub(r"\s+(on\w+|style|class|id)\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)", "", value, flags=re.I)
    allowed = {"p", "br", "strong", "b", "em", "i", "h2", "h3", "ul", "ol", "li", "blockquote"}

    def tag(match):
        name = match.group(1).lower()
        if name not in allowed:
            return ""
        closing = match.group(0).startswith("</")
        return f"</{name}>" if closing else f"<{name}>"

    return re.sub(r"</?([a-zA-Z0-9]+)(?:\s[^>]*)?>", tag, value).strip()


def text_to_html(text: str) -> str:
    blocks = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line in {"* * *", "---"}:
            continue
        blocks.append(f"<p>{html.escape(line)}</p>")
    return "\n".join(blocks)


def default_content() -> dict:
    body = ""
    try:
        pages = PdfReader(str(ORIGINAL_PDF)).pages
        body = "\n\n".join((page.extract_text() or "").strip() for page in pages)
    except Exception:
        body = "The paper is ready for editing. Add the story body here, then publish a new PDF."
    return {"title": DEFAULT_TITLE, "dek": DEFAULT_DEK, "body_html": text_to_html(body), "updated_at": None}


def load_content() -> dict:
    if not CONTENT_PATH.exists():
        content = default_content()
        save_content(content)
        return content
    try:
        content = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
        return {
            "title": str(content.get("title", DEFAULT_TITLE)),
            "dek": str(content.get("dek", DEFAULT_DEK)),
            "body_html": clean_html(str(content.get("body_html", ""))),
            "updated_at": content.get("updated_at"),
        }
    except (OSError, json.JSONDecodeError):
        return default_content()


def save_content(content: dict) -> None:
    tmp = CONTENT_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(CONTENT_PATH)


def html_to_plain(value: str) -> list[str]:
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    value = re.sub(r"</(?:p|h2|h3|li|blockquote)>\s*", "\n", value, flags=re.I)
    value = re.sub(r"<[^>]+>", "", value)
    value = html.unescape(value)
    return [line.strip() for line in value.splitlines() if line.strip()]


def build_pdf(content: dict) -> None:
    ink = colors.HexColor("#15252A")
    petrol = colors.HexColor("#0C5555")
    coral = colors.HexColor("#EF735F")
    muted = colors.HexColor("#5C6F71")
    paper = colors.HexColor("#FBF9F5")
    line = colors.HexColor("#D8CEC0")
    styles = getSampleStyleSheet()
    title = ParagraphStyle("Title", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=30, textColor=ink, spaceAfter=14)
    dek = ParagraphStyle("Dek", parent=styles["BodyText"], fontName="Helvetica", fontSize=12, leading=17, textColor=muted, spaceAfter=22)
    heading = ParagraphStyle("Heading", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=petrol, spaceBefore=14, spaceAfter=8)
    body = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=10.5, leading=15.5, textColor=ink, spaceAfter=9)

    class PaperDoc(BaseDocTemplate):
        pass

    doc = PaperDoc(str(PUBLISHED_PDF), pagesize=letter, leftMargin=0.78 * inch, rightMargin=0.78 * inch, topMargin=0.75 * inch, bottomMargin=0.7 * inch, title=content["title"], author="Rishva Iyer")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="paper")

    def page(canvas, document):
        canvas.saveState()
        canvas.setFillColor(paper)
        canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
        canvas.setStrokeColor(line)
        canvas.line(doc.leftMargin, letter[1] - 42, letter[0] - doc.rightMargin, letter[1] - 42)
        canvas.setFillColor(petrol)
        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.drawString(doc.leftMargin, letter[1] - 31, "RISHVA IYER  /  PENTEL / CANARYNORTH")
        canvas.setFillColor(muted)
        canvas.setFont("Helvetica", 7.5)
        canvas.drawRightString(letter[0] - doc.rightMargin, 25, f"RISHVA IYER  /  {document.page:02d}")
        canvas.restoreState()

    doc.addPageTemplates([PageTemplate(id="body", frames=frame, onPage=page)])
    story = [Paragraph(html.escape(content["title"]), title), Paragraph(html.escape(content["dek"]), dek), Spacer(1, 4)]
    for line_text in html_to_plain(content["body_html"]):
        if line_text.startswith("## "):
            story.append(Paragraph(html.escape(line_text[3:]), heading))
        elif line_text.startswith("### "):
            story.append(Paragraph(html.escape(line_text[4:]), heading))
        else:
            story.append(Paragraph(html.escape(line_text), body))
    doc.build(story)


def authorized(handler: BaseHTTPRequestHandler) -> bool:
    raw = handler.headers.get("Cookie", "")
    token = next((part.split("=", 1)[1] for part in raw.split("; ") if part.startswith(f"{SESSION_COOKIE}=")), "")
    with LOCK:
        expires = SESSIONS.get(token, 0)
        if expires and expires > time.time():
            return True
        SESSIONS.pop(token, None)
    return False


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")

    def send_bytes(self, payload: bytes, content_type: str, status=HTTPStatus.OK, extra=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store" if self.path.startswith("/edit/") or self.path.startswith("/api/") else "public, max-age=60")
        for key, value in (extra or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(payload)

    def json(self, payload, status=HTTPStatus.OK, extra=None):
        self.send_bytes(json.dumps(payload, ensure_ascii=False).encode(), "application/json; charset=utf-8", status, extra)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > 1_000_000:
            raise ValueError("payload too large")
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path == "/edit/pentell" or path == "/edit/pentell/":
            if not EDITOR_HTML.exists():
                return self.send_bytes(b"Editor unavailable", "text/plain", HTTPStatus.NOT_FOUND)
            return self.send_bytes(EDITOR_HTML.read_bytes(), "text/html; charset=utf-8")
        if path == "/api/pentell/content":
            if not authorized(self):
                return self.json({"error": "Owner access required."}, HTTPStatus.UNAUTHORIZED)
            return self.json(load_content())
        if path == "/blog/canaryNorth_v8_folio.pdf":
            source = PUBLISHED_PDF if PUBLISHED_PDF.exists() else ORIGINAL_PDF
            return self.send_bytes(source.read_bytes(), "application/pdf", extra={"Content-Disposition": "inline"})
        return self.serve_static(path)

    def serve_static(self, path):
        relative = path.lstrip("/") or "index.html"
        candidate = (ROOT / relative).resolve()
        if ROOT not in candidate.parents and candidate != ROOT:
            return self.send_bytes(b"Not found", "text/plain", HTTPStatus.NOT_FOUND)
        if candidate.is_dir():
            candidate = candidate / "index.html"
        if not candidate.is_file():
            return self.send_bytes(b"Not found", "text/plain", HTTPStatus.NOT_FOUND)
        content_type = "text/html; charset=utf-8" if candidate.suffix == ".html" else "application/octet-stream"
        if candidate.suffix == ".css":
            content_type = "text/css; charset=utf-8"
        elif candidate.suffix in {".js", ".mjs"}:
            content_type = "text/javascript; charset=utf-8"
        elif candidate.suffix == ".json":
            content_type = "application/json; charset=utf-8"
        elif candidate.suffix in {".jpg", ".jpeg"}:
            content_type = "image/jpeg"
        elif candidate.suffix == ".png":
            content_type = "image/png"
        elif candidate.suffix == ".webp":
            content_type = "image/webp"
        return self.send_bytes(candidate.read_bytes(), content_type)

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        try:
            payload = self.read_json()
        except (ValueError, json.JSONDecodeError):
            return self.json({"error": "Invalid request."}, HTTPStatus.BAD_REQUEST)
        if path == "/api/pentell/login":
            expected = os.environ.get("PENTELL_EDITOR_PASSWORD", "")
            supplied = str(payload.get("password", ""))
            if not expected or not hmac.compare_digest(supplied, expected):
                return self.json({"error": "Owner access denied."}, HTTPStatus.UNAUTHORIZED)
            token = secrets.token_urlsafe(32)
            with LOCK:
                SESSIONS[token] = time.time() + 1800
            return self.json({"ok": True}, extra={"Set-Cookie": f"{SESSION_COOKIE}={token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=1800"})
        if path in {"/api/pentell/save", "/api/pentell/publish"}:
            if not authorized(self):
                return self.json({"error": "Owner access required."}, HTTPStatus.UNAUTHORIZED)
            content = {
                "title": str(payload.get("title", "")).strip()[:240],
                "dek": str(payload.get("dek", "")).strip()[:500],
                "body_html": clean_html(str(payload.get("body_html", "")))[:500_000],
                "updated_at": int(time.time()),
            }
            if not content["title"] or not content["body_html"]:
                return self.json({"error": "Title and body are required."}, HTTPStatus.BAD_REQUEST)
            save_content(content)
            if path.endswith("publish"):
                build_pdf(content)
                return self.json({"ok": True, "published_at": content["updated_at"], "pdf": "/blog/canaryNorth_v8_folio.pdf"})
            return self.json({"ok": True, "saved_at": content["updated_at"]})
        return self.json({"error": "Not found."}, HTTPStatus.NOT_FOUND)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    if not CONTENT_PATH.exists():
        save_content(default_content())
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Portfolio server listening on {port}")
    server.serve_forever()
