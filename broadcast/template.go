package main

import (
	"bytes"
	_ "embed"
	"html"
	"strings"
	"text/template"
)

//go:embed email.html
var emailTemplate string

// templatePost wraps Post with HTML-escaped fields for safe use in text/template.
type templatePost struct {
	Post
	EscapedTitle       string
	EscapedDescription string
}

type EmailData struct {
	Posts []templatePost
}

func renderEmail(posts []Post) (string, error) {
	tmpl, err := template.New("email").Parse(emailTemplate)
	if err != nil {
		return "", err
	}

	var tPosts []templatePost
	for _, p := range posts {
		// Limit tags to 3
		if len(p.Tags) > 3 {
			p.Tags = p.Tags[:3]
		}
		tPosts = append(tPosts, templatePost{
			Post:               p,
			EscapedTitle:       html.EscapeString(p.Title),
			EscapedDescription: html.EscapeString(p.Description),
		})
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, EmailData{Posts: tPosts}); err != nil {
		return "", err
	}

	// Replace placeholder with Resend's Mustache variable (can't be in the Go template directly)
	result := strings.Replace(buf.String(), "__RESEND_UNSUBSCRIBE_URL__", "{{{RESEND_UNSUBSCRIBE_URL}}}", 1)
	return result, nil
}
