# Stage 1: Build the .NET application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
# Copy csproj and restore as distinct layers
COPY *.csproj ./
RUN dotnet restore

# Copy everything else and build
COPY . ./

# Install Python and run the data cleaning script.
# The generated 'inventory.xlsx' will be in the 'Data' folder and will be
# included in the final published output.
RUN apt-get update && apt-get install -y python3
RUN python3 Data/clean_excel.py Data/"Fix asset & Inventory List 2008-2025១.xlsx" Data/inventory.xlsx

# Publish the application
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Serve the application
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Disable Server GC to drastically reduce memory usage and prevent Render Status 139 Segfaults
ENV DOTNET_gcServer=0

COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "SchoolAPI.dll"]