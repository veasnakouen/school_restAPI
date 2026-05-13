using System.ComponentModel.DataAnnotations;

using System.Collections.Generic;
public class CreateRoleRequest
{
    [Required(ErrorMessage = "RoleName is required!")]
    public string RoleName { get; set; } = null!;
    public List<string>? Permissions { get; set; }
}