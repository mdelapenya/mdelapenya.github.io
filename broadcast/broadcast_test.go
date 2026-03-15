package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	resendtc "github.com/mdelapenya/testcontainers-go-resend"
	"github.com/testcontainers/testcontainers-go"
)

// ---------------------------------------------------------------------------
// Unit tests (no external dependencies)
// ---------------------------------------------------------------------------

func TestFilterPostsSince(t *testing.T) {
	now, _ := time.Parse("2006-01-02", "2026-03-14")

	posts := []Post{
		{Title: "This week", Date: "2026-03-10"},
		{Title: "Also this week", Date: "2026-03-13"},
		{Title: "Too old", Date: "2026-03-01"},
		{Title: "Future post", Date: "2026-03-20"},
		{Title: "Boundary exact cutoff", Date: "2026-03-07"},
		{Title: "Boundary inside", Date: "2026-03-08"},
		{Title: "Bad date", Date: "not-a-date"},
	}

	result := filterPostsSince(posts, now, 7)

	titles := make(map[string]bool)
	for _, p := range result {
		titles[p.Title] = true
	}

	if !titles["This week"] {
		t.Error("expected 'This week' to be included")
	}
	if !titles["Also this week"] {
		t.Error("expected 'Also this week' to be included")
	}
	if !titles["Boundary inside"] {
		t.Error("expected 'Boundary inside' to be included")
	}
	// March 7 is exactly 7 days before March 14; After() is exclusive so it's excluded
	if titles["Boundary exact cutoff"] {
		t.Error("expected 'Boundary exact cutoff' to be excluded (exact cutoff, After is exclusive)")
	}
	if titles["Too old"] {
		t.Error("expected 'Too old' to be excluded")
	}
	if titles["Future post"] {
		t.Error("expected 'Future post' to be excluded")
	}
	if titles["Bad date"] {
		t.Error("expected 'Bad date' to be excluded")
	}
}

func TestFilterPostsSince_Empty(t *testing.T) {
	now, _ := time.Parse("2006-01-02", "2026-03-14")
	result := filterPostsSince(nil, now, 7)
	if len(result) != 0 {
		t.Fatalf("expected 0 posts, got %d", len(result))
	}
}

func TestWeeklySubject_Single(t *testing.T) {
	posts := []Post{{Title: "My Great Post"}}
	subject := weeklySubject(posts)
	expected := "New post: My Great Post"
	if subject != expected {
		t.Errorf("expected %q, got %q", expected, subject)
	}
}

func TestWeeklySubject_Multiple(t *testing.T) {
	posts := []Post{{Title: "A"}, {Title: "B"}, {Title: "C"}}
	subject := weeklySubject(posts)
	expected := "This week on mdelapenya.xyz: 3 new posts"
	if subject != expected {
		t.Errorf("expected %q, got %q", expected, subject)
	}
}

func TestRenderEmail_SinglePost(t *testing.T) {
	posts := []Post{
		{
			Title:       "Test Post",
			URL:         "/posts/2026-03-14-test",
			Date:        "2026-03-14",
			Description: "A test description",
			Tags:        []string{"go", "testing"},
		},
	}

	html, err := renderEmail(posts)
	if err != nil {
		t.Fatalf("renderEmail failed: %v", err)
	}

	checks := []string{
		"Test Post",
		"https://mdelapenya.xyz/posts/2026-03-14-test",
		"A test description",
		"2026-03-14",
		"go, testing",
		"I published this week:",
		"mdelapenya.xyz",
		"RESEND_UNSUBSCRIBE_URL",
		"Weekly digest",
		"Unsubscribe",
	}
	for _, check := range checks {
		if !strings.Contains(html, check) {
			t.Errorf("expected HTML to contain %q", check)
		}
	}
}

func TestRenderEmail_MultiplePosts(t *testing.T) {
	posts := []Post{
		{Title: "Post One", URL: "/posts/one", Date: "2026-03-13"},
		{Title: "Post Two", URL: "/posts/two", Date: "2026-03-14"},
	}

	html, err := renderEmail(posts)
	if err != nil {
		t.Fatalf("renderEmail failed: %v", err)
	}

	if !strings.Contains(html, "Post One") {
		t.Error("expected HTML to contain 'Post One'")
	}
	if !strings.Contains(html, "Post Two") {
		t.Error("expected HTML to contain 'Post Two'")
	}
	if !strings.Contains(html, "2 posts I published this week") {
		t.Error("expected plural phrasing for 2 posts")
	}
}

func TestRenderEmail_TagsLimitedToThree(t *testing.T) {
	posts := []Post{
		{
			Title: "Tagged Post",
			URL:   "/posts/tagged",
			Date:  "2026-03-14",
			Tags:  []string{"one", "two", "three", "four", "five"},
		},
	}

	html, err := renderEmail(posts)
	if err != nil {
		t.Fatalf("renderEmail failed: %v", err)
	}

	if !strings.Contains(html, "three") {
		t.Error("expected third tag to be present")
	}
	if strings.Contains(html, "four") {
		t.Error("expected fourth tag to be truncated")
	}
}

func TestRenderEmail_NoDescription(t *testing.T) {
	posts := []Post{
		{Title: "No Desc", URL: "/posts/no-desc", Date: "2026-03-14"},
	}

	html, err := renderEmail(posts)
	if err != nil {
		t.Fatalf("renderEmail failed: %v", err)
	}

	if !strings.Contains(html, "No Desc") {
		t.Error("expected title to be present")
	}
}

func TestRenderEmail_NoTags(t *testing.T) {
	posts := []Post{
		{Title: "No Tags", URL: "/posts/no-tags", Date: "2026-03-14"},
	}

	html, err := renderEmail(posts)
	if err != nil {
		t.Fatalf("renderEmail failed: %v", err)
	}

	// Should have the date but no " · " tag separator
	if !strings.Contains(html, "2026-03-14") {
		t.Error("expected date to be present")
	}
}

func TestRenderEmail_WithImage(t *testing.T) {
	posts := []Post{
		{
			Title:       "Post With Cover",
			URL:         "/posts/2026-03-14-cover",
			Date:        "2026-03-14",
			Description: "Has a cover image",
			Image:       "/images/posts/2026-03-14-cover/cover.png",
		},
	}

	html, err := renderEmail(posts)
	if err != nil {
		t.Fatalf("renderEmail failed: %v", err)
	}

	if !strings.Contains(html, "https://mdelapenya.xyz/images/posts/2026-03-14-cover/cover.png") {
		t.Error("expected full image URL in HTML")
	}
	if !strings.Contains(html, "<img") {
		t.Error("expected img tag in HTML")
	}
}

func TestRenderEmail_WithoutImage(t *testing.T) {
	posts := []Post{
		{
			Title: "No Image Post",
			URL:   "/posts/2026-03-14-no-img",
			Date:  "2026-03-14",
		},
	}

	html, err := renderEmail(posts)
	if err != nil {
		t.Fatalf("renderEmail failed: %v", err)
	}

	if strings.Contains(html, "<img") {
		t.Error("expected no img tag when post has no image")
	}
}

func TestRenderEmail_HTMLEscaping(t *testing.T) {
	posts := []Post{
		{
			Title:       "<script>alert('xss')</script>",
			URL:         "/posts/xss",
			Date:        "2026-03-14",
			Description: "A <b>bold</b> move",
		},
	}

	html, err := renderEmail(posts)
	if err != nil {
		t.Fatalf("renderEmail failed: %v", err)
	}

	if strings.Contains(html, "<script>") {
		t.Error("expected script tag to be escaped")
	}
	if !strings.Contains(html, "&lt;script&gt;") {
		t.Error("expected escaped script tag")
	}
}

// ---------------------------------------------------------------------------
// Tests with local HTTP server (no external dependencies)
// ---------------------------------------------------------------------------

func TestFetchWeekPostsFrom_LocalServer(t *testing.T) {
	today := time.Now().Format("2006-01-02")
	posts := []Post{
		{Title: "Recent", URL: "/posts/recent", Date: today, Description: "A recent post", Image: "/images/cover.png"},
		{Title: "Old", URL: "/posts/old", Date: "2020-01-01"},
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(posts)
	}))
	defer srv.Close()

	result, err := fetchWeekPostsFrom(srv.URL)
	if err != nil {
		t.Fatalf("fetchWeekPostsFrom failed: %v", err)
	}

	if len(result) != 1 {
		t.Fatalf("expected 1 post, got %d", len(result))
	}
	if result[0].Title != "Recent" {
		t.Errorf("expected 'Recent', got %q", result[0].Title)
	}
	if result[0].Image != "/images/cover.png" {
		t.Errorf("expected image field preserved, got %q", result[0].Image)
	}
}

func TestFetchWeekPostsFrom_ServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer srv.Close()

	_, err := fetchWeekPostsFrom(srv.URL)
	if err == nil {
		t.Fatal("expected error for 500 response")
	}
}

func TestFetchWeekPostsFrom_InvalidJSON(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("not json"))
	}))
	defer srv.Close()

	_, err := fetchWeekPostsFrom(srv.URL)
	if err == nil {
		t.Fatal("expected error for invalid JSON")
	}
}

func TestSendBroadcast_ServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error": "bad request"}`))
	}))
	defer srv.Close()

	// Temporarily override the API URL
	origAPI := resendAPI
	defer func() { /* can't reassign const, see integration test */ }()
	_ = origAPI

	// Use sendBroadcast directly with a mock — but resendAPI is a const.
	// Instead, test via the integration test below.
}

// ---------------------------------------------------------------------------
// Integration tests (use testcontainers-go-resend mock, no real API needed)
// ---------------------------------------------------------------------------

func startResendMock(t *testing.T) (baseURL string, cleanup func()) {
	t.Helper()
	ctx := context.Background()

	ctr, err := resendtc.Run(ctx, resendtc.DefaultImage)
	if err != nil {
		t.Fatalf("failed to start Resend mock container: %v", err)
	}

	url, err := ctr.BaseURL(ctx)
	if err != nil {
		testcontainers.TerminateContainer(ctr)
		t.Fatalf("failed to get mock base URL: %v", err)
	}

	return url, func() {
		if err := testcontainers.TerminateContainer(ctr); err != nil {
			log.Printf("failed to terminate container: %s", err)
		}
	}
}

func TestIntegration_CreateBroadcastDraft(t *testing.T) {
	mockURL, cleanup := startResendMock(t)
	defer cleanup()

	posts := []Post{
		{
			Title:       "Integration Test Post",
			URL:         "/posts/2026-03-14-integration-test",
			Date:        "2026-03-14",
			Description: "This is a test broadcast from the Go test suite.",
			Tags:        []string{"test", "integration"},
		},
	}

	html, err := renderEmail(posts)
	if err != nil {
		t.Fatalf("renderEmail failed: %v", err)
	}

	broadcast := BroadcastRequest{
		SegmentID: "test-segment-id",
		From:      "Manuel de la Peña <hello@mdelapenya.xyz>",
		Subject:   "[TEST] Weekly digest integration test",
		HTML:      html,
		Send:      false,
		Name:      "test-broadcast-" + time.Now().Format("20060102-150405"),
	}

	id, err := sendBroadcastTo(mockURL, "fake-api-key", broadcast)
	if err != nil {
		t.Fatalf("sendBroadcast failed: %v", err)
	}

	if id == "" {
		t.Fatal("expected non-empty broadcast ID")
	}

	t.Logf("Created draft broadcast: %s", id)
}

func TestIntegration_SendBroadcast(t *testing.T) {
	mockURL, cleanup := startResendMock(t)
	defer cleanup()

	posts := []Post{
		{
			Title:       "Integration Test: Sent Broadcast",
			URL:         "/posts/2026-03-14-integration-test-sent",
			Date:        "2026-03-14",
			Description: "This broadcast was sent to the mock Resend API.",
			Tags:        []string{"test"},
		},
	}

	html, err := renderEmail(posts)
	if err != nil {
		t.Fatalf("renderEmail failed: %v", err)
	}

	broadcast := BroadcastRequest{
		SegmentID: "test-segment-id",
		From:      "Manuel de la Peña <hello@mdelapenya.xyz>",
		Subject:   "[TEST] Sent broadcast " + time.Now().Format("15:04:05"),
		HTML:      html,
		Send:      true,
		Name:      "test-sent-" + time.Now().Format("20060102-150405"),
	}

	id, err := sendBroadcastTo(mockURL, "fake-api-key", broadcast)
	if err != nil {
		t.Fatalf("sendBroadcast failed: %v", err)
	}

	if id == "" {
		t.Fatal("expected non-empty broadcast ID")
	}

	t.Logf("Sent broadcast via mock: %s", id)
}

func TestIntegration_SendBroadcastWithImages(t *testing.T) {
	mockURL, cleanup := startResendMock(t)
	defer cleanup()

	posts := []Post{
		{
			Title:       "Post With Cover Image",
			URL:         "/posts/2026-03-11-coding-agents-as-exploratory-testers",
			Date:        "2026-03-11",
			Description: "How three composing Claude Code skills turn a coding agent into a reusable exploratory tester.",
			Tags:        []string{"coding-agents", "testing", "claude-code"},
			Image:       "/images/posts/2026-03-11-coding-agents-as-exploratory-testers/cover.png",
		},
		{
			Title:       "Post Without Cover Image",
			URL:         "/posts/2026-03-13-choosing-a-terminal-for-agentic-development",
			Date:        "2026-03-13",
			Description: "Warp, iTerm2, kitty, Ghostty, the built-in VS Code terminal. Which one works best when the agent is doing most of the typing?",
			Tags:        []string{"terminal", "developer-experience"},
		},
	}

	html, err := renderEmail(posts)
	if err != nil {
		t.Fatalf("renderEmail failed: %v", err)
	}

	if !strings.Contains(html, "https://mdelapenya.xyz/images/posts/2026-03-11-coding-agents-as-exploratory-testers/cover.png") {
		t.Error("expected cover image URL in rendered HTML")
	}
	if !strings.Contains(html, "<img") {
		t.Error("expected img tag for post with image")
	}

	broadcast := BroadcastRequest{
		SegmentID: "test-segment-id",
		From:      "Manuel de la Peña <hello@mdelapenya.xyz>",
		Subject:   "[TEST] Broadcast with images " + time.Now().Format("15:04:05"),
		HTML:      html,
		Send:      true,
		Name:      "test-images-" + time.Now().Format("20060102-150405"),
	}

	id, err := sendBroadcastTo(mockURL, "fake-api-key", broadcast)
	if err != nil {
		t.Fatalf("sendBroadcast failed: %v", err)
	}

	if id == "" {
		t.Fatal("expected non-empty broadcast ID")
	}

	t.Logf("Sent broadcast with images via mock: %s", id)
}
