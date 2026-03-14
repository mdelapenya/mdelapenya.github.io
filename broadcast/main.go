package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

const (
	resendAPI = "https://api.resend.com"
	siteURL   = "https://mdelapenya.xyz"
)

type Post struct {
	Title       string   `json:"title"`
	URL         string   `json:"url"`
	Date        string   `json:"date"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
	Image       string   `json:"image"`
}

type BroadcastRequest struct {
	SegmentID string `json:"segment_id"`
	From      string `json:"from"`
	Subject   string `json:"subject"`
	HTML      string `json:"html"`
	Send      bool   `json:"send"`
	Name      string `json:"name,omitempty"`
}

type BroadcastResponse struct {
	ID string `json:"id"`
}

func main() {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		fmt.Fprintln(os.Stderr, "RESEND_API_KEY is required")
		os.Exit(1)
	}

	segmentID := os.Getenv("RESEND_SEGMENT_ID")
	if segmentID == "" {
		fmt.Fprintln(os.Stderr, "RESEND_SEGMENT_ID is required")
		os.Exit(1)
	}

	fromAddress := os.Getenv("BROADCAST_FROM")
	if fromAddress == "" {
		fromAddress = "Manuel de la Peña <hello@mdelapenya.xyz>"
	}

	dryRun := os.Getenv("DRY_RUN") == "true"

	// Fetch the Hugo index
	posts, err := fetchWeekPosts()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to fetch posts: %v\n", err)
		os.Exit(1)
	}

	if len(posts) == 0 {
		fmt.Println("No posts published this week. Skipping broadcast.")
		os.Exit(0)
	}

	fmt.Printf("Found %d post(s) published this week:\n", len(posts))
	for _, p := range posts {
		fmt.Printf("  - %s (%s)\n", p.Title, p.Date)
	}

	// Render email HTML
	html, err := renderEmail(posts)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to render email: %v\n", err)
		os.Exit(1)
	}

	// Build subject
	subject := weeklySubject(posts)

	if dryRun {
		fmt.Printf("\n--- DRY RUN ---\n")
		fmt.Printf("Subject: %s\n", subject)
		fmt.Printf("From: %s\n", fromAddress)
		fmt.Printf("Segment: %s\n", segmentID)
		fmt.Printf("Posts: %d\n", len(posts))
		fmt.Printf("HTML length: %d bytes\n", len(html))
		fmt.Printf("\n%s\n", html)
		os.Exit(0)
	}

	// Send broadcast
	broadcast := BroadcastRequest{
		SegmentID: segmentID,
		From:      fromAddress,
		Subject:   subject,
		HTML:      html,
		Send:      true,
		Name:      fmt.Sprintf("Weekly digest %s", time.Now().Format("2006-01-02")),
	}

	id, err := sendBroadcast(apiKey, broadcast)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to send broadcast: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Broadcast sent: %s\n", id)
}

func fetchWeekPosts() ([]Post, error) {
	return fetchWeekPostsFrom(siteURL + "/index.json")
}

func fetchWeekPostsFrom(indexURL string) ([]Post, error) {
	resp, err := http.Get(indexURL)
	if err != nil {
		return nil, fmt.Errorf("fetching index: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("index returned %d", resp.StatusCode)
	}

	var allPosts []Post
	if err := json.NewDecoder(resp.Body).Decode(&allPosts); err != nil {
		return nil, fmt.Errorf("decoding index: %w", err)
	}

	return filterPostsSince(allPosts, time.Now(), 7), nil
}

func filterPostsSince(posts []Post, now time.Time, days int) []Post {
	cutoff := now.AddDate(0, 0, -days)
	var result []Post
	for _, p := range posts {
		t, err := time.Parse("2006-01-02", p.Date)
		if err != nil {
			continue
		}
		if t.After(cutoff) && !t.After(now) {
			result = append(result, p)
		}
	}
	return result
}

func weeklySubject(posts []Post) string {
	if len(posts) == 1 {
		return fmt.Sprintf("New post: %s", posts[0].Title)
	}
	return fmt.Sprintf("This week on mdelapenya.xyz: %d new posts", len(posts))
}

func sendBroadcast(apiKey string, broadcast BroadcastRequest) (string, error) {
	return sendBroadcastTo(resendAPI, apiKey, broadcast)
}

func sendBroadcastTo(baseURL, apiKey string, broadcast BroadcastRequest) (string, error) {
	body, err := json.Marshal(broadcast)
	if err != nil {
		return "", fmt.Errorf("marshaling broadcast: %w", err)
	}

	req, err := http.NewRequest("POST", baseURL+"/broadcasts", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("sending request: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("resend API returned %d: %s", resp.StatusCode, string(respBody))
	}

	var result BroadcastResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("decoding response: %w", err)
	}

	return result.ID, nil
}
