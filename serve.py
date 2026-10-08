#!/usr/bin/env python3
"""
Somphea Reak Studio - Standalone Admin Management Dashboard Server
Serves the admin web app on port 5500 with zero external dependencies.
"""
import http.server
import socketserver
import os
import webbrowser

PORT = int(os.environ.get('PORT', 5500))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and caching headers for admin static assets
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print(f"✨ Somphea Reak Admin Portal running on http://127.0.0.1:{PORT}")
        print("🔗 Connected to unified backend API at http://127.0.0.1:5000")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down Somphea Reak Admin server.")
