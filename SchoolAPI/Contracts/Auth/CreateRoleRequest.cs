using System.ComponentModel.DataAnnotations;

public class CreateRoleRequest
{
    [Required(ErrorMessage = "RoleName is required!")]
    public string RoleName { get; set; } = null!;
}