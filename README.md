# School REST API (ASP.NET Core)

A simple ASP.NET Core Web API for managing school data (students, classes, teachers, and enrollments). This repository provides endpoints to create, read, update, and delete resources and is intended as a starter/template for building a school management API in C#.

## Features

- CRUD operations for Students, Teachers, and Classes
- Enrollments management
- JSON-based REST API
- Input validation and basic error handling
- (Optional) Entity Framework Core migrations and database seeding

## Tech stack

- .NET (recommended: .NET 7 or later)
- ASP.NET Core Web API
- C#
- (Optional) Entity Framework Core with SQL Server / PostgreSQL / SQLite
- (Optional) Docker for containerized deployments

## Prerequisites

- .NET SDK installed (dotnet --version; .NET 7 or later recommended)
- Optional: a running database (SQL Server, PostgreSQL, SQLite) and connection string
- Optional: Docker (if you want to run in a container)
- Optional: dotnet-ef global tool for EF Core migrations:
  - dotnet tool install --global dotnet-ef

## Getting started

1. Clone the repository:

   git clone https://github.com/veasnakouen/school_restAPI.git
   cd school_restAPI

2. Restore dependencies and build:

   dotnet restore
   dotnet build

3. Configure settings

   - The project uses standard ASP.NET Core configuration sources (appsettings.json, appsettings.Development.json, environment variables, and user secrets).
   - Set your connection string in appsettings.json or via an environment variable:
     - Example appsettings.json entry:
       "ConnectionStrings": {
         "DefaultConnection": "Server=localhost;Database=SchoolDb;User Id=sa;Password=Your_password123;"
       }
   - Common environment variables:
     - ASPNETCORE_ENVIRONMENT — e.g. Development, Production
     - ConnectionStrings__DefaultConnection — connection string override (note double underscore)
     - JWT__Secret — secret used for signing tokens (if authentication is implemented)

   If the repo uses EF Core migrations, run:

   dotnet ef database update --project <YourProject.csproj> --startup-project <YourStartupProject.csproj>

   (Replace with actual project names/paths if the solution contains multiple projects.)

4. Run the API

   - Locally:

     dotnet run --project <YourProject.csproj>

     By default the application will use the URLs configured (check launchSettings.json); you can also set the URL:

     DOTNET_URLS="http://localhost:5000" dotnet run --project <YourProject.csproj>

   - From Visual Studio / VS Code:
     - Open the solution and run using the debugger (F5) or without debugging (Ctrl+F5).

5. Docker (optional)

   - Build:

     docker build -t school-api .

   - Run:

     docker run -p 5000:80 --env ConnectionStrings__DefaultConnection="<your-connection-string>" school-api

   Adjust ports and environment variables as needed.

## API Endpoints (examples)

Below are example endpoints — adapt to your actual controllers and routes.

- GET /api/students — list all students
- GET /api/students/{id} — get a single student
- POST /api/students — create a student
- PUT /api/students/{id} — update a student
- DELETE /api/students/{id} — delete a student

- GET /api/teachers
- GET /api/classes
- POST /api/enrollments
- GET /api/enrollments

Use a tool like curl, HTTPie, Postman, or the Swagger UI (if enabled) to interact with the API.

## Swagger / OpenAPI

If the project has Swagger enabled, the Swagger UI is typically available at:

- /swagger or /swagger/index.html (when running in Development)

This provides interactive documentation for all available endpoints.

## Environment variables (examples)

- ASPNETCORE_ENVIRONMENT — environment name (Development, Production)
- ConnectionStrings__DefaultConnection — database connection string
- JWT__Secret — JWT signing secret (if using authentication)
- Logging__LogLevel__Default — log level settings

## Testing

If the solution includes tests, run them with:

    dotnet test

## Contributing

Contributions are welcome. Please open an issue or submit a pull request with a clear description of changes and tests where applicable. Include migration files or database seeding updates when relevant.

If you want me to update the README to include specific project names, the exact EF Core commands, or the Swagger URL, tell me the project/assembly names (the .csproj filenames) and whether EF Core is used.

## License

Add a LICENSE file to the repository and reference it here (for example, MIT).

## Notes / What I changed

- Replaced Node.js / Express instructions with .NET / ASP.NET Core instructions.
- Added dotnet build/run/restore/test commands and guidance for appsettings / environment variables.
- Added optional Docker and EF Core migration notes.

If you'd like, I can commit this README update for you and open a PR on a branch (for example `docs/update-readme-aspnet`). Tell me which branch name to use or if you want me to push directly to main.
