
namespace SchoolAPI.Contracts.Auth;

public record UserDetail
{
    public string? Id { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public bool TwoFactorEnabled { get; set; }
    public List<string>?  Roles { get; set; }
    public bool PhoneNumberConfirm { get; set; }
    public int AccessFailedCount { get; set; }
}