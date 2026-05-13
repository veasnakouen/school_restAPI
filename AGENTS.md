# AGENTS.md — AI coding agent instructions

Purpose
- Provide concise, local guidance so AI coding agents can be productive immediately.

Quick commands
- Restore & build backend: `dotnet restore` then `dotnet build` (run from repo root or `SchoolAPI/`).
- Run backend: `dotnet run --project SchoolAPI/SchoolAPI.csproj` or use the IDE debugger (F5).
- Run backend tests: `dotnet test SchoolAPI.Tests/`.
- EF Core (if used): `dotnet ef database update --project SchoolAPI/SchoolAPI.csproj --startup-project SchoolAPI/`.
- Frontend (Angular) dev: `npm install` then `npm start` in `SchoolUI/`.
- Frontend build: `npm run build` in `SchoolUI/`.
- Docker: project has `docker-compose.yml` at the repo root for containerized runs.

Where to look (key files)
- Repository README: [README.md](README.md)
- Backend entry/config: [SchoolAPI/Program.cs](SchoolAPI/Program.cs)
- Frontend package scripts: [SchoolUI/package.json](SchoolUI/package.json)
- Authorization matrix & API docs: [SchoolAPI/Document/authorization-permission-matrix.md](SchoolAPI/Document/authorization-permission-matrix.md), [SchoolAPI/Document/api.md](SchoolAPI/Document/api.md)
- Tests: [SchoolAPI.Tests](SchoolAPI.Tests/)

Important conventions & notes
- Project layout: backend code lives in `SchoolAPI/`; UI lives in `SchoolUI/`.
- Authorization: policy-based permissions are registered at startup (`PermissionHandler`, `PermissionRequirement`, `Permissions.cs`). Use the permission matrix in the `SchoolAPI/Document` folder for mapping.
- Local secrets: `secrets.json` is loaded during development (see `Program.cs`) — do not commit credentials.
- Database connection: prefer `ConnectionStrings__DefaultConnection` env var for CI/containers.
- Logging: Serilog is configured in `Program.cs`.

Agent guidance (behavioural)
- Link, don't duplicate: prefer linking to existing docs in `SchoolAPI/Document` and the repository `README.md` rather than copying them.
- Minimal edits: when updating docs or agent files, keep changes targeted and add links back to canonical docs.
- Tests first: run `dotnet test` before proposing or merging changes to backend logic.

Suggested next agent customizations
- Add a small skill to run backend tests and collect results (`dotnet test SchoolAPI.Tests/`).
- Add a CI/Pipeline helper skill that knows how to build Docker images and run migrations.

If you want, I can also create a `.github/copilot-instructions.md` variant and/or a small skill file that automates local test runs — tell me which you'd prefer.
