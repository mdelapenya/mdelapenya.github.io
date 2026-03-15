package main

import (
	"bytes"
	"html"
	"strings"
	"text/template"
)

const emailTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;margin:0;padding:0;">
  <div style="max-width:580px;margin:0 auto;padding:20px 0 48px;">

    <!-- Header -->
    <div style="text-align:center;padding:0 0 24px;">
      <h1 style="color:#1a1a1a;font-size:24px;font-weight:700;margin:0;">mdelapenya.xyz</h1>
      <p style="color:#6b7280;font-size:14px;margin:8px 0 0;">Weekly digest</p>
    </div>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">

    <!-- Greeting -->
    <p style="color:#374151;font-size:16px;line-height:26px;margin:0 0 16px;">
      Hi there,
    </p>
    <p style="color:#374151;font-size:16px;line-height:26px;margin:0 0 24px;">
      {{if eq (len .Posts) 1}}Here's what I published this week:{{else}}Here are the {{len .Posts}} posts I published this week:{{end}}
    </p>

    <!-- Posts -->
    {{range .Posts}}
    <div style="background-color:#f9fafb;border-radius:8px;overflow:hidden;margin:0 0 16px;border:1px solid #e5e7eb;">
      {{if .Image}}
      <a href="{{.URL}}" style="display:block;">
        <img src="https://mdelapenya.xyz{{.Image}}" alt="{{.EscapedTitle}}" style="width:100%;height:auto;display:block;" />
      </a>
      {{end}}
      <div style="padding:16px 20px;">
        <a href="{{.URL}}" style="color:#3b82f6;font-size:16px;font-weight:600;text-decoration:none;line-height:24px;">
          {{.EscapedTitle}}
        </a>
        {{if .Description}}
        <p style="color:#6b7280;font-size:14px;line-height:22px;margin:8px 0 0;">
          {{.EscapedDescription}}
        </p>
        {{end}}
        <p style="color:#9ca3af;font-size:12px;margin:8px 0 0;">
          {{.Date}}{{if .Tags}} · {{range $i, $t := .Tags}}{{if $i}}, {{end}}{{$t}}{{end}}{{end}}
        </p>
      </div>
    </div>
    {{end}}

    <!-- CTA -->
    <div style="text-align:center;margin:24px 0;">
      <a href="https://mdelapenya.xyz/posts/" style="background-color:#3b82f6;border-radius:4px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;display:inline-block;">
        Read on the blog
      </a>
    </div>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

    <!-- Footer -->
    <p style="color:#9ca3af;font-size:12px;line-height:20px;text-align:center;margin:0;">
      You're receiving this because you subscribed at
      <a href="https://mdelapenya.xyz/subscribe/" style="color:#3b82f6;text-decoration:none;">mdelapenya.xyz</a>.
    </p>
    <p style="color:#9ca3af;font-size:12px;line-height:20px;text-align:center;margin:8px 0 0;">
      <a href="__RESEND_UNSUBSCRIBE_URL__" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
    </p>

  </div>
</body>
</html>`

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
