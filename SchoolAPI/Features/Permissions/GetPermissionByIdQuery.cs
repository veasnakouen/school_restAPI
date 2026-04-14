using MediatR;
using SchoolAPI.Entities;

public record GetPermissionByIdQuery(int Id) : IRequest<Permission?>;
