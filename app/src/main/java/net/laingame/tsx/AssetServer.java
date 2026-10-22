package net.laingame.tsx;

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.net.Uri;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

final class AssetServer extends Thread {
    // Fixed port: the origin (and thus localStorage saves) depends on it.
    static final int PORT = 8573;

    private static final Map<String, String> MIME = new HashMap<>();
    static {
        MIME.put("html", "text/html; charset=utf-8");
        MIME.put("js", "text/javascript; charset=utf-8");
        MIME.put("mjs", "text/javascript; charset=utf-8");
        MIME.put("css", "text/css; charset=utf-8");
        MIME.put("json", "application/json");
        MIME.put("vtt", "text/vtt; charset=utf-8");
        MIME.put("svg", "image/svg+xml");
        MIME.put("png", "image/png");
        MIME.put("jpg", "image/jpeg");
        MIME.put("webp", "image/webp");
        MIME.put("gif", "image/gif");
        MIME.put("mp4", "video/mp4");
        MIME.put("webm", "video/webm");
        MIME.put("ogg", "audio/ogg");
        MIME.put("mp3", "audio/mpeg");
        MIME.put("wav", "audio/wav");
        MIME.put("glb", "model/gltf-binary");
        MIME.put("gltf", "model/gltf+json");
        MIME.put("wasm", "application/wasm");
        MIME.put("ttf", "font/ttf");
        MIME.put("woff", "font/woff");
        MIME.put("woff2", "font/woff2");
    }

    private final AssetManager assets;
    private final ServerSocket server;

    AssetServer(AssetManager assets) throws IOException {
        this.assets = assets;
        this.server = new ServerSocket(PORT, 50, InetAddress.getByName("127.0.0.1"));
        setDaemon(true);
    }

    @Override
    public void run() {
        while (true) {
            try {
                Socket s = server.accept();
                new Thread(() -> handle(s)).start();
            } catch (IOException e) {
                return;
            }
        }
    }

    private void handle(Socket socket) {
        try (Socket s = socket) {
            BufferedReader reader = new BufferedReader(new InputStreamReader(s.getInputStream(), StandardCharsets.ISO_8859_1));
            String request = reader.readLine();
            if (request == null) return;
            String[] parts = request.split(" ");
            if (parts.length < 2) return;
            String method = parts[0];

            String range = null;
            for (String line; (line = reader.readLine()) != null && !line.isEmpty(); ) {
                if (line.toLowerCase(Locale.ROOT).startsWith("range:")) {
                    range = line.substring(6).trim();
                }
            }

            String path = Uri.decode(parts[1].split("\\?")[0]);
            if (path.endsWith("/")) path += "index.html";
            String asset = "www" + path;

            InputStream in;
            long length;
            try {
                AssetFileDescriptor fd = assets.openFd(asset);
                length = fd.getLength();
                in = fd.createInputStream();
            } catch (FileNotFoundException e) {
                try {
                    byte[] data = readAll(assets.open(asset));
                    length = data.length;
                    in = new ByteArrayInputStream(data);
                } catch (IOException e2) {
                    writeHead(s.getOutputStream(), "404 Not Found", "text/plain", 0, null);
                    return;
                }
            }

            try (InputStream body = in) {
                long start = 0, end = length - 1;
                String status = "200 OK";
                String contentRange = null;

                if (range != null && range.startsWith("bytes=")) {
                    String spec = range.substring(6).split(",")[0].trim();
                    int dash = spec.indexOf('-');
                    String a = spec.substring(0, dash), b = spec.substring(dash + 1);
                    if (a.isEmpty()) {
                        start = Math.max(0, length - Long.parseLong(b));
                    } else {
                        start = Long.parseLong(a);
                        if (!b.isEmpty()) end = Math.min(Long.parseLong(b), length - 1);
                    }
                    if (start > end || start >= length) {
                        writeHead(s.getOutputStream(), "416 Range Not Satisfiable", "text/plain", 0,
                                "bytes */" + length);
                        return;
                    }
                    status = "206 Partial Content";
                    contentRange = "bytes " + start + "-" + end + "/" + length;
                }

                long count = end - start + 1;
                OutputStream out = s.getOutputStream();
                writeHead(out, status, mime(path), count, contentRange);
                if (method.equals("HEAD")) return;

                long skipped = 0;
                while (skipped < start) {
                    long n = body.skip(start - skipped);
                    if (n <= 0) return;
                    skipped += n;
                }
                byte[] buf = new byte[64 * 1024];
                while (count > 0) {
                    int n = body.read(buf, 0, (int) Math.min(buf.length, count));
                    if (n < 0) break;
                    out.write(buf, 0, n);
                    count -= n;
                }
                out.flush();
            }
        } catch (IOException | RuntimeException ignored) {
        }
    }

    private static void writeHead(OutputStream out, String status, String type, long length, String contentRange)
            throws IOException {
        StringBuilder h = new StringBuilder()
                .append("HTTP/1.1 ").append(status).append("\r\n")
                .append("Content-Type: ").append(type).append("\r\n")
                .append("Content-Length: ").append(length).append("\r\n")
                .append("Accept-Ranges: bytes\r\n")
                .append("Connection: close\r\n");
        if (contentRange != null) h.append("Content-Range: ").append(contentRange).append("\r\n");
        h.append("\r\n");
        out.write(h.toString().getBytes(StandardCharsets.ISO_8859_1));
    }

    private static String mime(String path) {
        int dot = path.lastIndexOf('.');
        String ext = dot < 0 ? "" : path.substring(dot + 1).toLowerCase(Locale.ROOT);
        String type = MIME.get(ext);
        return type != null ? type : "application/octet-stream";
    }

    private static byte[] readAll(InputStream in) throws IOException {
        try (InputStream is = in) {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buf = new byte[64 * 1024];
            for (int n; (n = is.read(buf)) > 0; ) bos.write(buf, 0, n);
            return bos.toByteArray();
        }
    }
}
