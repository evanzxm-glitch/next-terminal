package app

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"next-terminal/server/config"
)

func TestRoutesAreOnlyAvailableBelowBasePath(t *testing.T) {
	workingDirectory, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}

	testRoot := t.TempDir()
	if err := os.Chdir(testRoot); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_ = os.Chdir(workingDirectory)
	})

	buildDirectory := filepath.Join(testRoot, "web", "build")
	if err := os.MkdirAll(buildDirectory, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(buildDirectory, "index.html"), []byte("next-terminal"), 0o644); err != nil {
		t.Fatal(err)
	}
	config.GlobalCfg.Debug = true
	t.Cleanup(func() {
		config.GlobalCfg.Debug = false
	})

	e := setupRoutes()
	routes := make(map[string]bool)
	for _, route := range e.Routes() {
		routes[route.Method+" "+route.Path] = true
	}

	for _, route := range []string{
		"GET /next-terminal/",
		"GET /next-terminal/branding",
		"POST /next-terminal/login",
		"GET /next-terminal/sessions/:id/ssh",
	} {
		if !routes[route] {
			t.Errorf("expected route %q to be registered", route)
		}
	}

	for _, route := range []string{
		"GET /",
		"GET /branding",
		"POST /login",
		"GET /sessions/:id/ssh",
	} {
		if routes[route] {
			t.Errorf("expected route %q not to be registered", route)
		}
	}

	request := httptest.NewRequest(http.MethodGet, basePath+"/", nil)
	response := httptest.NewRecorder()
	e.ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("GET %s/ returned %d, want %d", basePath, response.Code, http.StatusOK)
	}
	if response.Body.String() != "next-terminal" {
		t.Fatalf("GET %s/ returned body %q", basePath, response.Body.String())
	}

	request = httptest.NewRequest(http.MethodGet, "/", nil)
	response = httptest.NewRecorder()
	e.ServeHTTP(response, request)
	if response.Code != http.StatusNotFound {
		t.Fatalf("GET / returned %d, want %d", response.Code, http.StatusNotFound)
	}
}
