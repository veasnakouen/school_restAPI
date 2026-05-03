namespace SchoolAPI.Contracts;

public class SystemSettingsDto
{
    public string SiteName { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public bool AllowRegistration { get; set; }
    public bool RequireEmailVerification { get; set; }
    public bool MaintenanceMode { get; set; }
    public bool DefaultToDarkMode { get; set; }
    public string? LogoBase64 { get; set; }
    public string? BankQrCodeBase64 { get; set; }
}