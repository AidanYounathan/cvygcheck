# CVYG Check-In System — Learning Hub

This is your map. Every note links to every other note. Start here, follow the arrows.

---

## What Is This?

A QR-code-based check-in system for CVYG (Chaldean Vicariate Youth Group). It lives at [cvygcheck.vercel.app](https://cvygcheck.vercel.app).

**The flow in one sentence:** An iPad shows a rotating QR code → a youth scans it with their phone → fills out a form → gets checked in, with GPS and device verification.

---

## How to Read These Docs

Each note teaches one concept. They're designed to be read in order the first time, then used as a reference.

1. [[01 - Tech Stack]] — What tools we're using and why
2. [[02 - Project Structure]] — How the files are organized
3. [[03 - Database Schema]] — The five database tables
4. [[04 - Token System]] — How QR codes rotate securely
5. [[05 - Check-In Flow]] — The full user journey, step by step
6. [[06 - Geofencing]] — How we verify someone is physically present
7. [[07 - Dynamic Forms]] — How admins configure the check-in questions
8. [[08 - Admin Dashboard]] — What admins see and can control
9. [[09 - Security Model]] — All five layers of protection
10. [[10 - API Reference]] — Every endpoint, what it does, what it returns
11. [[11 - Deployment & Environment]] — Vercel, Neon, and environment variables

---

## Key Concepts at a Glance

| Concept | Where it lives | Why it matters |
|---|---|---|
| Rolling QR tokens | [[04 - Token System]] | Prevents token sharing |
| Geofence | [[06 - Geofencing]] | Requires physical presence |
| `extras` JSON | [[07 - Dynamic Forms]] | Flexible fields without migrations |
| httpOnly cookie | [[09 - Security Model]] | Admin auth |
| Claim-on-load | [[04 - Token System]] | Triggers instant QR rotation |

---

## Quick Navigation

- **Something broke at check-in?** → [[05 - Check-In Flow#Error Codes]]
- **Add a new form question?** → [[07 - Dynamic Forms]]
- **Add a parish location?** → [[08 - Admin Dashboard#Location Manager]]
- **Deploy a new version?** → [[11 - Deployment & Environment]]
