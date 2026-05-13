using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Permissions.GetAll
{
    public class GetPermissionsQueryHandler : IRequestHandler<GetPermissionsQuery, Result<List<PermissionDto>>>
    {
        private readonly IApplicationDbContext _context;

        public GetPermissionsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<List<PermissionDto>>> Handle(GetPermissionsQuery request, CancellationToken cancellationToken)
        {
            var dbPermissions = await _context.Permissions.AsNoTracking().OrderBy(p => p.Name).ToListAsync(cancellationToken);

            var permissions = dbPermissions
                .Select(p => new PermissionDto
                {
                    Value = p.Name,
                    Type = p.Name.Contains('.') ? p.Name.Split('.')[0] : "general",
                    Description = CreateDescription(p.Name)
                })
                .ToList();

            return Result<List<PermissionDto>>.Success(permissions);
        }

        private static string CreateDescription(string permissionName)
        {
            var parts = permissionName.Split('.');
            var action = parts.Length > 1 ? parts[1] : permissionName;
            return $"{CultureInfo.CurrentCulture.TextInfo.ToTitleCase(action)} {(parts.Length > 1 ? parts[0] : "")}".Trim();
        }
    }
}