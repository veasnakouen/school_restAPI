namespace SchoolAPI.Entities;

public class Organization
{
    // We use a fixed ID since there is usually only one global settings record
    public string Id { get; set; } = "DEFAULT";
    public string AppName { get; set; } = "School Management System";
    public string? LogoBase64 { get; set; }
}