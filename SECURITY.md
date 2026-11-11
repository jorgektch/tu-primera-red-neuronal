# Security notes

This is a client-side slideshow, **not a secure sandbox** for executing arbitrary web content.

- Load remote READMEs only from public GitHub URLs. The viewer escapes raw HTML in remote Markdown as a defense-in-depth precaution, but this is **not a complete Markdown security boundary**.
- Do not paste authentication tokens, credentials, patient data, or other sensitive content into your README or configuration.
- External fonts, JavaScript libraries, photos, and icons use public CDNs and require Internet access.
- Avoid adding executable scripts, event handlers, iframes, or untrusted HTML to your local `README.md`.
- For a public multi-user service processing unknown third-party Markdown, adopt a vetted sanitizer and a strict Content Security Policy before enabling arbitrary content ingestion.

To report a security issue, use the contact address in the repository README rather than posting exploit details in a public issue.
