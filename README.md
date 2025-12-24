```markdown
# School REST API (ASP.NET Core)

This project is an ASP.NET Core RESTful API for managing school data (students, teachers, classes, enrollments) using SQL Server running in Docker.

## Features

- CRUD operations for Students, Teachers, and Classes
- Enrollments management
- JSON-based REST API
- Database: SQL Server (containerized with Docker)
- Recommended: Entity Framework Core for data access and migrations

## Tech stack

- .NET 6+ / .NET 7+
- ASP.NET Core Web API
- Entity Framework Core (optional but recommended)
- SQL Server (containerized)
- Docker & Docker Compose

## Prerequisites

- .NET SDK (6.0 or later)
- Docker and Docker Compose
- (Optional) EF Core CLI: `dotnet ef`

## Getting started (development)

1. Clone the repository:

   git clone https://github.com/veasnakouen/school_restAPI.git
   cd school_restAPI

2. Set the connection string.

   The app should read the connection string from configuration (e.g., `appsettings.Development.json`) or environment variables. Example:

   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=db,1433;Database=SchoolDb;User Id=sa;Password=Your_password123;TrustServerCertificate=True;"
   }
   ```

   Or set an environment variable:
   - `ConnectionStrings__DefaultConnection=Server=db,1433;Database=SchoolDb;User Id=sa;Password=Your_password123;TrustServerCertificate=True;`

3. Apply EF Core migrations (if using EF Core):

   ```bash
   dotnet tool restore
   dotnet ef database update --project ./src/YourApiProject.csproj
   ```

4. Run locally (replace path with your project .csproj):

   ```bash
   dotnet run --project ./src/YourApiProject/YourApiProject.csproj
   ```

## Running with Docker Compose

Below is an example `docker-compose.yml` that starts SQL Server and the API. Replace project names, paths and DLL names as needed.

```yaml
version: '3.8'
services:
  db:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=Your_password123
    ports:
      - "1433:1433"
    healthcheck:
      test: [ "CMD-SHELL", "/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P \"Your_password123\" -Q \"SELECT 1\"" ]
      interval: 10s
      timeout: 10s
      retries: 10

  api:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      db:
        condition: service_healthy
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Server=db,1433;Database=SchoolDb;User Id=sa;Password=Your_password123;TrustServerCertificate=True;
    ports:
      - "5000:80"
    command: ["dotnet", "YourApiProject.dll"]
```

Notes:
- Replace `Your_password123` with a secure password meeting SQL Server rules.
- Replace `YourApiProject.dll` with the DLL name produced by your build, or modify the build stage to publish and run the published app.

## Example Dockerfile (API)

A minimal Dockerfile that builds and publishes the API:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore "src/YourApiProject/YourApiProject.csproj"
RUN dotnet publish "src/YourApiProject/YourApiProject.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:7.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:80
ENTRYPOINT ["dotnet", "YourApiProject.dll"]
```

## Applying migrations automatically (optional)

To apply EF Core migrations when the container starts, you can add a small entrypoint script (or call `dotnet ef database update` during startup). Example approach in the Dockerfile/entrypoint:

- Create an entrypoint script that waits for the DB to be ready, then runs:
  `dotnet ef database update --no-build --project /src/YourApiProject/YourApiProject.csproj`

Or, perform migrations from the host before starting containers:
  `docker-compose run --rm api dotnet ef database update --project ./src/YourApiProject/YourApiProject.csproj`

## Environment variables

- ASPNETCORE_ENVIRONMENT — e.g., Development, Production
- ConnectionStrings__DefaultConnection — SQL Server connection string
- Any app-specific secrets (JWT keys, logging settings, etc.)

## API Endpoints (examples)

- GET /students — list all students
- GET /students/{id} — get a single student
- POST /students — create a student
- PUT /students/{id} — update a student
- DELETE /students/{id} — delete a student

Adjust endpoints to match your controllers and routes.

## Testing

Run unit/integration tests with:

```bash
dotnet test
```

## Troubleshooting

- SQL Server container not starting: ensure the `SA_PASSWORD` meets complexity requirements (at least 8 characters, with uppercase, lowercase, digits and/or symbols).
- Connection issues: from within the API container use `db` as the SQL Server host, and ensure `depends_on` + healthcheck are configured.

## Contributing & License

Contributions welcome — open an issue or submit a PR. Add a LICENSE file (e.g., MIT) if desired.
```
