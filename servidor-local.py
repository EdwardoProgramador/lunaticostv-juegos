"""Servidor local para probar el sitio y el juego, con las mismas reglas que vercel.json.

Uso (desde la raíz del proyecto):  python3 servidor-local.py        → http://127.0.0.1:8000
                                    python3 servidor-local.py 8080   → otro puerto

· /proyectos sirve proyectos.html y /proyectos.html redirige a /proyectos (como en Vercel). Sin esto, el servidor simple
  de Python (python3 -m http.server) da 404 al cambiar de página y el juego se corta.
· Sin caché: siempre se ve lo último que se editó.
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def send_head(self):
        path, _, query = self.path.partition('?')
        qs = '?' + query if query else ''
        if path.endswith('.html') and os.path.dirname(path) == '/':
            self.send_response(301)
            self.send_header('Location', ('/' if path == '/index.html' else path[:-5]) + qs)
            self.end_headers()
            return None
        clean = path.rstrip('/')
        if clean and '.' not in os.path.basename(clean) and os.path.isfile(os.path.join(ROOT, clean.lstrip('/') + '.html')):
            self.path = clean + '.html' + qs
        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    print(f'Sitio + juego en http://127.0.0.1:{PORT}  (Ctrl+C para parar)')
    ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
