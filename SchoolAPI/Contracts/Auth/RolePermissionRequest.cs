using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.Contracts.Auth;

public class RolePermissionRequest
{
    [Required(ErrorMessage = "Permission is required!")]
    public string Permission { get; set; } = string.Empty;
}