namespace SchoolAPI.Entities;

public class AppRolePermission
{
    public string RoleId { get; set; }
    public AppRole Role { get; set; }

    public int PermissionId { get; set; }
    public Permission Permission { get; set; }
}