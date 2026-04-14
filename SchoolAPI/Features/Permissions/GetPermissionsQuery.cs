using MediatR;
using SchoolAPI.Entities;
using System.Collections.Generic;

public record GetPermissionsQuery() : IRequest<List<Permission>>;
