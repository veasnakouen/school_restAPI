using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using SchoolAPI.Constant;

namespace SchoolAPI.Authorization;

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private static readonly HashSet<string> ReadSatisfyingActions = new(StringComparer.OrdinalIgnoreCase)
    {
        "create",
        "update",
        "delete",
        "assign",
        "write",
        "manage"
    };

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Task.CompletedTask;
        }

        if (context.User.IsInRole(Roles.Admin) || context.User.HasClaim(Permissions.ClaimType, requirement.Permission))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        if (TryParsePermission(requirement.Permission, out var requiredPrefix, out var requiredAction) && requiredAction.Equals("read", StringComparison.OrdinalIgnoreCase))
        {
            var hasWritablePermission = context.User.Claims
                .Where(claim => claim.Type == Permissions.ClaimType)
                .Select(claim => claim.Value)
                .Any(value => TryParsePermission(value, out var candidatePrefix, out var candidateAction)
                    && candidatePrefix.Equals(requiredPrefix, StringComparison.OrdinalIgnoreCase)
                    && ReadSatisfyingActions.Contains(candidateAction));

            if (hasWritablePermission)
            {
                context.Succeed(requirement);
            }
        }

        return Task.CompletedTask;
    }

    private static bool TryParsePermission(string permission, out string prefix, out string action)
    {
        prefix = string.Empty;
        action = string.Empty;

        var separatorIndex = permission.LastIndexOf('.');
        if (separatorIndex <= 0 || separatorIndex >= permission.Length - 1)
        {
            return false;
        }

        prefix = permission[..separatorIndex];
        action = permission[(separatorIndex + 1)..];
        return true;
    }
}