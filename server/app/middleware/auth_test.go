package middleware

import "testing"

func TestStripBasePath(t *testing.T) {
	tests := map[string]string{
		"/next-terminal":                  "/",
		"/next-terminal/":                 "/",
		"/next-terminal/login":            "/login",
		"/next-terminal/static/app.js":    "/static/app.js",
		"/next-terminal/sessions/abc/ssh": "/sessions/abc/ssh",
		"/next-terminal-other/login":      "/next-terminal-other/login",
	}

	for input, expected := range tests {
		if actual := stripBasePath(input); actual != expected {
			t.Errorf("stripBasePath(%q) = %q, want %q", input, actual, expected)
		}
	}
}
