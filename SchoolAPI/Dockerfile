# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the csproj and restore dependencies
COPY ["SchoolAPI/SchoolAPI.csproj", "SchoolAPI/"]
RUN dotnet restore "SchoolAPI/SchoolAPI.csproj"

# Copy the rest of the code and build
COPY . .
WORKDIR "/src/SchoolAPI"
RUN dotnet build "SchoolAPI.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "SchoolAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Run
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Expose port 8080 (the default port for .NET 8 inside Linux containers)
EXPOSE 8080

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SchoolAPI.dll"]