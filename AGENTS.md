# Repository Instructions

- Always use semantic commit messages and PR titles. This repository uses semantic-release, so release automation depends on semantic commit conventions.
- For any CLI command that sends multiline text, prefer writing to a temporary file and passing a file argument when supported. Do not embed multiline bodies directly in shell command strings.
