#!/usr/bin/env python3
"""
Somphea Reak Studio - Standalone Admin Management Dashboard Server
Serves the admin web app on port 5500 with zero external dependencies.
"""
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import http.server
import socketserver
import os
import socket

PORT = int(os.environ.get('PORT', 5500))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

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
    lan_ip = get_lan_ip()
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print(f">> Somphea Reak Admin Portal running:")
        print(f"   PC Desktop:   http://127.0.0.1:{PORT}")
        print(f"   Mobile Wi-Fi: http://{lan_ip}:{PORT}")
        print(f">> Centralized Backend API:")
        print(f"   PC Desktop:   http://127.0.0.1:5000")
        print(f"   Mobile Wi-Fi: http://{lan_ip}:5000")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down Somphea Reak Admin server.")
