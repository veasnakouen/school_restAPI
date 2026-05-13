using System.ComponentModel.DataAnnotations;

public class UpdateRoleRequest
{
    [Required(ErrorMessage = "RoleName is required!")]
    public string RoleName { get; set; } = null!;
}