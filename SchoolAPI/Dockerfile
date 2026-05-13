# Stage 1: Build the .NET application
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
# Copy csproj and restore as distinct layers
COPY *.csproj ./
RUN dotnet restore
# Copy everything else and build
COPY . ./
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Serve the application
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Install native dependencies and default fonts required by QuestPDF (SkiaSharp) on Linux
RUN apt-get update && apt-get install -y fontconfig libfontconfig1 fonts-liberation && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "SchoolAPI.dll"]