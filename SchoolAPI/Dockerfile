FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# that should be copy form the solution file ("**.sln")
# COPY School.sln ./
# COPY SchoolAPI/SchoolAPI.csproj ./SchoolAPI/
# COPY SchoolData/SchoolData.csproj ./SchoolData/
COPY SchoolAPI.csproj ./
RUN dotnet restore SchoolAPI.csproj

COPY . ./
RUN dotnet publish SchoolAPI.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app
EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SchoolAPI.dll"]