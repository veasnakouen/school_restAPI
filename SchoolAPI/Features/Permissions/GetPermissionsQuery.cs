using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using System.Collections.Generic;

namespace SchoolAPI.Application.Features.Permissions.GetAll
{
    public record GetPermissionsQuery : IRequest<Result<List<PermissionDto>>>;
}