# Passway

Passway is a developer tool for managing application secrets and controlled access across projects and environments.

It is designed to help teams keep sensitive configuration out of source code, reduce manual secret sharing, and provide a cleaner way for services to access the values they need.

## Status

This repository contains the API service for Passway.

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

The local server starts on `http://localhost:4000`.
