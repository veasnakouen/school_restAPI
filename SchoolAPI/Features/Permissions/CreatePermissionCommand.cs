using MediatR;
using SchoolAPI.Entities;

public record CreatePermissionCommand(Permission Permission) : IRequest<Permission>;
