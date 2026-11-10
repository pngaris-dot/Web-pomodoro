package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	uploadDir     = "uploads"
	presetDir     = "static/backgrounds"
	maxUploadSize = 200 << 20
)

type background struct {
	Name   string `json:"name"`
	URL    string `json:"url"`
	Type   string `json:"type"`
	Source string `json:"source"`
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func mediaKind(name string) string {
	switch strings.ToLower(filepath.Ext(name)) {
	case ".jpg", ".jpeg", ".png", ".webp", ".gif":
		return "image"
	case ".mp4", ".webm":
		return "video"
	}
	return ""
}

func listFiles(dir, urlPrefix, source string) []background {
	result := []background{}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return result
	}

	for _, entry := range entries {
		kind := mediaKind(entry.Name())
		if entry.IsDir() || kind == "" {
			continue
		}
		result = append(result, background{
			Name:   entry.Name(),
			URL:    urlPrefix + url.PathEscape(entry.Name()),
			Type:   kind,
			Source: source,
		})
	}
	return result
}

func detectType(head []byte) (ext, kind string) {
	if len(head) >= 12 && string(head[4:8]) == "ftyp" {
		return ".mp4", "video"
	}

	switch http.DetectContentType(head) {
	case "video/mp4":
		return ".mp4", "video"
	case "video/webm":
		return ".webm", "video"
	case "image/jpeg":
		return ".jpg", "image"
	case "image/png":
		return ".png", "image"
	case "image/webp":
		return ".webp", "image"
	case "image/gif":
		return ".gif", "image"
	}
	return "", ""
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	file, _, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Thiếu file hoặc file quá lớn (tối đa 200MB)")
		return
	}
	defer file.Close()

	head := make([]byte, 512)
	n, _ := file.Read(head)

	ext, kind := detectType(head[:n])
	if ext == "" {
		writeError(w, http.StatusBadRequest, "Chỉ nhận ảnh JPG/PNG/WEBP/GIF hoặc video MP4/WEBM")
		return
	}
	file.Seek(0, io.SeekStart)

	name := fmt.Sprintf("up-%d%s", time.Now().UnixNano(), ext)
	path := filepath.Join(uploadDir, name)

	out, err := os.Create(path)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Không lưu được file")
		return
	}

	_, err = io.Copy(out, file)
	out.Close()
	if err != nil {
		os.Remove(path)
		writeError(w, http.StatusInternalServerError, "Lỗi khi ghi file")
		return
	}

	writeJSON(w, http.StatusOK, background{
		Name:   name,
		URL:    "/uploads/" + name,
		Type:   kind,
		Source: "upload",
	})
}

func handleDelete(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")

	if name == "" || name != filepath.Base(name) || !strings.HasPrefix(name, "up-") {
		writeError(w, http.StatusBadRequest, "Tên file không hợp lệ")
		return
	}

	err := os.Remove(filepath.Join(uploadDir, name))
	if os.IsNotExist(err) {
		writeError(w, http.StatusNotFound, "File không tồn tại")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Không xóa được, thử lại sau")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"removed": name})
}

func handleBackgrounds(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		items := listFiles(presetDir, "/backgrounds/", "preset")
		items = append(items, listFiles(uploadDir, "/uploads/", "upload")...)
		writeJSON(w, http.StatusOK, map[string]any{"items": items})
	case http.MethodPost:
		handleUpload(w, r)
	case http.MethodDelete:
		handleDelete(w, r)
	default:
		writeError(w, http.StatusMethodNotAllowed, "Phương thức không hỗ trợ")
	}
}

func noCache(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if !strings.HasPrefix(path, "/backgrounds/") && !strings.HasPrefix(path, "/uploads/") {
			w.Header().Set("Cache-Control", "no-store")
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	mime.AddExtensionType(".html", "text/html; charset=utf-8")
	mime.AddExtensionType(".css", "text/css; charset=utf-8")
	mime.AddExtensionType(".js", "text/javascript; charset=utf-8")
	mime.AddExtensionType(".mp4", "video/mp4")
	mime.AddExtensionType(".webm", "video/webm")

	os.MkdirAll(uploadDir, 0755)
	os.MkdirAll(presetDir, 0755)

	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.Dir("static")))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadDir))))
	mux.HandleFunc("/api/backgrounds", handleBackgrounds)

	log.Fatal(http.ListenAndServe(":8087", noCache(mux)))
}
