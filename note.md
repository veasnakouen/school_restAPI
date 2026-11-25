# Full-Stack Engineering & Tech Lead Command Reference

> **Stack:** C# / .NET / ASP.NET Core · Entity Framework Core · React (Vite + TypeScript) · Next.js (App Router) · HeroUI + Tailwind CSS · Docker & Diagnostics

---

## Table of Contents
1. [C# / .NET / ASP.NET Core CLI](#1-c--net--aspnet-core-cli)
   - [SDK, Runtime & Templates](#11-sdk-runtime--templates)
   - [Solution & Clean Architecture Scaffolding](#12-solution--clean-architecture-scaffolding)
   - [NuGet Package & Security Management](#13-nuget-package--security-management)
   - [Build, Run, Hot Reload, Test & Publish](#14-build-run-hot-reload-test--publish)
   - [User Secrets, Environments & HTTPS Dev Certs](#15-user-secrets-environments--https-dev-certs)
   - [Entity Framework Core (EF Core) CLI](#16-entity-framework-core-ef-core-cli)
   - [Diagnostics, Profiling & Global .NET Tools](#17-diagnostics-profiling--global-net-tools)
2. [React (Vite + TypeScript)](#2-react-vite--typescript)
   - [Scaffolding](#21-scaffolding)
   - [Core Enterprise Packages](#22-core-enterprise-packages)
   - [Dev, Typecheck, Lint, Build & Testing](#23-dev-typecheck-lint-build--testing)
3. [Next.js (App Router + TypeScript)](#3-nextjs-app-router--typescript)
   - [Scaffolding & CLI Flags](#31-scaffolding--cli-flags)
   - [Development, Build, Typegen & Diagnostics](#32-development-build-typegen--diagnostics)
   - [Bundle Analysis & Production](#33-bundle-analysis--production)
4. [HeroUI (React / Next.js + Tailwind CSS)](#4-heroui-react--nextjs--tailwind-css)
   - [HeroUI CLI (`heroui-cli`)](#41-heroui-cli-heroui-cli)
   - [Manual Installation & Setup](#42-manual-installation--setup)
   - [UI / UX Companion Packages](#43-ui--ux-companion-packages)
5. [Tech Lead Full-Stack Operations (Docker, API Client, Git & Ports)](#5-tech-lead-full-stack-operations)

---

## 1. C# / .NET / ASP.NET Core CLI

### 1.1 SDK, Runtime & Templates
```bash
# Inspect installed .NET SDKs, runtimes, and host OS info
dotnet --info
dotnet --version
dotnet --list-sdks
dotnet --list-runtimes

# List all available project/item templates
dotnet new list
dotnet new list --tag Web

# Pin a specific SDK version for the repo (creates global.json)
dotnet new globaljson --sdk-version 9.0.100 --roll-forward latestFeature
```

### 1.2 Solution & Clean Architecture Scaffolding
```bash
# Create solution and multi-layer Clean Architecture projects
dotnet new sln -n EnterpriseApp
dotnet new webapi -n EnterpriseApp.Api --use-controllers   # Controller-based Web API (omit flag for Minimal APIs)
dotnet new classlib -n EnterpriseApp.Application
dotnet new classlib -n EnterpriseApp.Domain
dotnet new classlib -n EnterpriseApp.Infrastructure
dotnet new xunit -n EnterpriseApp.UnitTests
dotnet new xunit -n EnterpriseApp.IntegrationTests

# Other common web templates
dotnet new mvc -n EnterpriseApp.Mvc
dotnet new blazor -n EnterpriseApp.Blazor
dotnet new worker -n EnterpriseApp.Worker

# Add projects to solution (supports folder grouping with -s)
dotnet sln add EnterpriseApp.Api/EnterpriseApp.Api.csproj -s src
dotnet sln add EnterpriseApp.Application/EnterpriseApp.Application.csproj -s src
dotnet sln add EnterpriseApp.Domain/EnterpriseApp.Domain.csproj -s src
dotnet sln add EnterpriseApp.Infrastructure/EnterpriseApp.Infrastructure.csproj -s src
dotnet sln add EnterpriseApp.UnitTests/EnterpriseApp.UnitTests.csproj -s tests
dotnet sln add EnterpriseApp.IntegrationTests/EnterpriseApp.IntegrationTests.csproj -s tests

# Wire project-to-project dependencies
dotnet add EnterpriseApp.Application reference EnterpriseApp.Domain
dotnet add EnterpriseApp.Infrastructure reference EnterpriseApp.Application EnterpriseApp.Domain
dotnet add EnterpriseApp.Api reference EnterpriseApp.Application EnterpriseApp.Infrastructure
dotnet add EnterpriseApp.UnitTests reference EnterpriseApp.Application EnterpriseApp.Domain

# Inspect references and solution members
dotnet sln list
dotnet list EnterpriseApp.Api reference

# Add standard config/gitignore files
dotnet new gitignore
dotnet new editorconfig
```

### 1.3 NuGet Package & Security Management
```bash
# Add / update / remove NuGet packages
dotnet add EnterpriseApp.Api package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add EnterpriseApp.Api package Swashbuckle.AspNetCore
dotnet add EnterpriseApp.Api package Scalar.AspNetCore
dotnet add EnterpriseApp.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL --version 9.0.1
dotnet remove EnterpriseApp.Api package PackageName

# Common enterprise backend packages
dotnet add EnterpriseApp.Application package MediatR
dotnet add EnterpriseApp.Application package FluentValidation.DependencyInjectionExtensions
dotnet add EnterpriseApp.Infrastructure package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add EnterpriseApp.Api package Serilog.AspNetCore

# Dependency audit (Tech Lead security checks)
dotnet list package
dotnet list package --outdated
dotnet list package --deprecated
dotnet list package --vulnerable --include-transitive

# Restore & clear NuGet cache
dotnet restore
dotnet restore --no-cache --force
dotnet nuget locals all --clear
```

### 1.4 Build, Run, Hot Reload, Test & Publish
```bash
# Clean & Build
dotnet clean
dotnet build
dotnet build -c Release --no-restore

# Run & Hot Reload
dotnet run --project EnterpriseApp.Api
dotnet run --project EnterpriseApp.Api --launch-profile https
dotnet run --project EnterpriseApp.Api --environment Production --urls "http://localhost:5000"
dotnet watch --project EnterpriseApp.Api run                # Auto-restart / Hot Reload on file save
dotnet watch --project EnterpriseApp.Api test               # Continuous test runner

# Testing & Code Coverage
dotnet test
dotnet test --no-build --verbosity normal
dotnet test --filter "FullyQualifiedName~OrderServiceTests"
dotnet test --filter "Category=Integration"
dotnet test --collect:"XPlat Code Coverage"

# Code formatting (enforces .editorconfig rules)
dotnet format
dotnet format --verify-no-changes                          # Great for CI pipelines

# Production Publish
dotnet publish EnterpriseApp.Api -c Release -o ./publish
dotnet publish EnterpriseApp.Api -c Release -r linux-x64 --self-contained false -o ./publish
dotnet publish EnterpriseApp.Api -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o ./publish
```

### 1.5 User Secrets, Environments & HTTPS Dev Certs
```bash
# Manage local sensitive config without committing to Git
dotnet user-secrets init --project EnterpriseApp.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=appdb;Username=postgres;Password=secret" --project EnterpriseApp.Api
dotnet user-secrets set "JwtSettings:Secret" "super-secret-dev-key-min-32-chars" --project EnterpriseApp.Api
dotnet user-secrets list --project EnterpriseApp.Api
dotnet user-secrets remove "JwtSettings:Secret" --project EnterpriseApp.Api
dotnet user-secrets clear --project EnterpriseApp.Api

# HTTPS local development certificate management
dotnet dev-certs https --check
dotnet dev-certs https --trust
dotnet dev-certs https --clean
```

### 1.6 Entity Framework Core (EF Core) CLI
```bash
# Install / update the global EF Core CLI tool
dotnet tool install --global dotnet-ef
dotnet tool update --global dotnet-ef
dotnet ef --version

# Note: Use -p (Project containing DbContext/Migrations) and -s (Startup project with appsettings/Program.cs)
# Add a new migration
dotnet ef migrations add InitialCreate -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api -o Data/Migrations

# List, inspect & remove migrations
dotnet ef migrations list -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api
dotnet ef migrations remove -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api

# Apply migrations to database
dotnet ef database update -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api
dotnet ef database update PreviousMigrationName -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api   # Rollback to specific migration
dotnet ef database update 0 -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api                       # Rollback all migrations

# Generate SQL scripts for DBA review / CI/CD production deployments
dotnet ef migrations script -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api -o ./scripts/migrate.sql
dotnet ef migrations script --idempotent -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api -o ./scripts/migrate-idempotent.sql
dotnet ef migrations script FromMigration ToMigration -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api

# Self-contained migration executable (EF Core 6+)
dotnet ef migrations bundle -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api -o ./efbundle --force

# Database reset (Dev only!) & DbContext inspection
dotnet ef database drop --force -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api
dotnet ef dbcontext info -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api
dotnet ef dbcontext list -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api
dotnet ef dbcontext optimize -p EnterpriseApp.Infrastructure -s EnterpriseApp.Api   # Compiled model for faster cold starts

# Database-first reverse engineering (Scaffold models from existing DB)
dotnet ef dbcontext scaffold "Name=ConnectionStrings:DefaultConnection" Npgsql.EntityFrameworkCore.PostgreSQL -o Entities --context-dir Data -c AppDbContext --no-onconfiguring --force
```

### 1.7 Diagnostics, Profiling & Global .NET Tools
```bash
# Install production diagnostic tools
dotnet tool install --global dotnet-counters
dotnet tool install --global dotnet-trace
dotnet tool install --global dotnet-dump
dotnet tool install --global dotnet-gcdump
dotnet tool install --global dotnet-outdated-tool

# Monitor live CPU, GC heap, threadpool, and HTTP request/sec
dotnet-counters ps
dotnet-counters monitor --process-id <PID> --counters System.Runtime,Microsoft.AspNetCore.Hosting

# Capture trace / memory dump for latency or memory leak investigation
dotnet-trace collect --process-id <PID> --duration 00:00:30
dotnet-dump collect --process-id <PID>
```

---

## 2. React (Vite + TypeScript)

### 2.1 Scaffolding
```bash
# Create React + TypeScript project with Vite
npm create vite@latest my-react-app -- --template react-ts
pnpm create vite my-react-app --template react-ts
yarn create vite my-react-app --template react-ts
bun create vite my-react-app --template react-ts

# Enter project & install dependencies
cd my-react-app
npm install
```

### 2.2 Core Enterprise Packages
```bash
# Routing, Server State, Client State, Forms & Validation
npm install react-router-dom @tanstack/react-query zustand axios
npm install react-hook-form zod @hookform/resolvers

# UI, Icons, Animation & Dates
npm install lucide-react framer-motion dayjs clsx tailwind-merge

# Dev & Testing tools
npm install -D @tanstack/react-query-devtools
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D @playwright/test
```

### 2.3 Dev, Typecheck, Lint, Build & Testing
```bash
# Local development & preview
npm run dev
npm run dev -- --host --port 3000                 # Expose on LAN & custom port
npm run build
npm run preview

# Strict TypeScript check (without emitting JS) & Linting
npx tsc --noEmit
npm run lint
npx eslint . --fix

# Unit & E2E Tests
npx vitest
npx vitest run --coverage
npx playwright install
npx playwright test
npx playwright test --ui

# Dependency auditing & updates
npm outdated
npm audit
npm audit fix
```

---

## 3. Next.js (App Router + TypeScript)

### 3.1 Scaffolding & CLI Flags
```bash
# Interactive setup (recommended for new projects)
npx create-next-app@latest my-next-app

# Non-interactive enterprise setup (TypeScript, Tailwind, ESLint, App Router, src/, Turbopack)
npx create-next-app@latest my-next-app --ts --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*"

# Package manager variants
pnpm create next-app@latest my-next-app --ts --tailwind --eslint --app --src-dir
yarn create next-app my-next-app --ts --tailwind --eslint --app --src-dir
bun create next-app my-next-app --ts --tailwind --eslint --app --src-dir

# Useful flags for create-next-app:
# --yes              Skip prompts using defaults
# --empty            Minimal empty boilerplate
# --biome            Use Biome instead of ESLint
# --react-compiler   Enable React Compiler
# --skip-install     Scaffold without running npm install
# -e <url|name>      Bootstrap from official Next.js example
```

### 3.2 Development, Build, Typegen & Diagnostics
```bash
# Local dev server (with Turbopack)
npm run dev
npx next dev --turbopack -p 3000

# Production build & server
npx next build
npx next start -p 3000

# Linting, Typechecking & Route Type Generation
npx next lint
npx next typegen                                   # Generates typed routes/layout validator types
npx tsc --noEmit

# Environment & diagnostics info (for bug reports / CI checks)
npx next info
```

### 3.3 Bundle Analysis & Production
```bash
# Install bundle analyzer
npm install -D @next/bundle-analyzer

# Run build with bundle visualization (Linux/macOS vs PowerShell)
ANALYZE=true npm run build
# PowerShell:
$env:ANALYZE="true"; npm run build

# Clear Next.js build cache when troubleshooting stale routes/assets
# PowerShell:
Remove-Item -Recurse -Force .next
# Bash:
rm -rf .next
```

---

## 4. HeroUI (React / Next.js + Tailwind CSS)

> HeroUI (formerly NextUI) provides an official CLI (`heroui-cli`) as well as direct package installation.

### 4.1 HeroUI CLI (`heroui-cli`)
```bash
# Scaffold a brand-new HeroUI project (interactive template picker)
npx heroui-cli@latest init my-heroui-app
pnpm dlx heroui-cli@latest init my-heroui-app

# Initialize HeroUI inside an existing React or Next.js project
npx heroui-cli@latest init

# Install core HeroUI packages (@heroui/react & @heroui/styles)
npx heroui-cli@latest install

# Add specific components or inspect component docs in terminal
npx heroui-cli@latest add button input modal table
npx heroui-cli@latest doc button
npx heroui-cli@latest info button

# List installed HeroUI packages & upgrade them
npx heroui-cli@latest list
npx heroui-cli@latest upgrade
npx heroui-cli@latest uninstall

# Troubleshoot configuration, Tailwind plugins & peer dependencies
npx heroui-cli@latest doctor
npx heroui-cli@latest env
```

### 4.2 Manual Installation & Setup

#### Tailwind CSS v4 + HeroUI v3 (`@heroui/react` + `@heroui/styles`)
```bash
# Install HeroUI packages & Tailwind CSS v4
npm install @heroui/react @heroui/styles
npm install -D tailwindcss @tailwindcss/postcss
```

Ensure `globals.css` / `index.css` includes Tailwind + HeroUI plugin/styles:
```css
@import "tailwindcss";
@plugin "./hero.ts";
```

#### HeroUI v2 (Tailwind v3 + Framer Motion)
```bash
# Full package installation
npm install @heroui/react framer-motion

# Or modular individual packages (smaller bundle footprint)
npm install @heroui/system @heroui/theme framer-motion
npm install @heroui/button @heroui/input @heroui/table @heroui/modal @heroui/dropdown

# Tailwind v3 setup (if not already installed)
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

### 4.3 UI / UX Companion Packages
```bash
# Icons, Animations, Accessibility & Theme Management
npm install lucide-react framer-motion next-themes

# Toast notifications, Charts & Tables
npm install sonner @tanstack/react-table recharts

# Class merging utilities for clean component variants
npm install clsx tailwind-merge class-variance-authority
```

---

## 5. Tech Lead Full-Stack Operations

### 5.1 Docker & Docker Compose
```bash
# Build & start full stack (API + DB + Redis + Frontend)
docker compose up --build
docker compose up -d --build                      # Detached mode
docker compose down                                # Stop & remove containers
docker compose down -v                             # Stop & wipe volumes (reset DB)

# Logs & shell into running containers
docker compose logs -f school-api
docker compose exec postgres psql -U postgres -d SchoolDb
docker compose ps

# Clean up dangling images/build cache
docker system prune -af
```

### 5.2 OpenAPI / TypeScript Client Generation
```bash
# Generate strongly-typed TypeScript API client directly from ASP.NET Core OpenAPI/Swagger JSON
npx openapi-typescript http://localhost:5000/swagger/v1/swagger.json -o src/types/api.d.ts

# Or using Orval / NSwag for full React Query hooks generation
npm install -D orval
npx orval
```

### 5.3 Git Workflow (Feature / Release Hygiene)
```bash
# Branching & clean commits
git checkout -b feat/product-export
git status -s
git diff --stat
git add -p                                         # Interactive hunk staging
git commit -m "feat(inventory): add excel export endpoint"

# Sync with main cleanly
git fetch origin
git rebase origin/main

# Safe worktree workflow (review PRs or run parallel branches without switching main folder)
git worktree add ../hotfix-branch main
git worktree list
git worktree remove ../hotfix-branch
```

### 5.4 Quick Port & Process Troubleshooting (Windows PowerShell)
```powershell
# Find process occupying port 5000 / 5173 / 3000
netstat -ano | findstr :5000
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess

# Terminate stuck process by PID
Stop-Process -Id <PID> -Force

# Verify production build across both stacks in one command
dotnet build SchoolAPI/SchoolAPI.csproj -c Release; npm --prefix SchoolReac run build
```
