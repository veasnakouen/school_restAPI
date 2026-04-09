namespace SchoolAPI.Entities;

public class Permission
{
    public int Id { get; set; }
    public string Name { get; set; } // e.g., "class.read"
    public ICollection<AppRolePermission> RolePermissions { get; set; }
}