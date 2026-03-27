#nullable enable

using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Auth.Queries.GetUsers;

/// <summary>
/// Handler for GetUsersQuery
/// </summary>
public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, GetUsersQueryResponse>
{
    private readonly UserManager<AppUser> _userManager;

    public GetUsersQueryHandler(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<GetUsersQueryResponse> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = _userManager.Users.AsQueryable();

            // Apply filtering if provided
            if (!string.IsNullOrEmpty(request.FilterOn) && !string.IsNullOrEmpty(request.FilterQuery))
            {
                if (request.FilterOn.Equals("name", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(u => EF.Functions.Like(u.FullName, $"%{request.FilterQuery}%"));
                }
                else if (request.FilterOn.Equals("email", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(u => EF.Functions.Like(u.Email ?? "", $"%{request.FilterQuery}%"));
                }
            }

            var users = await query.ToListAsync(cancellationToken);
            var totalCount = users.Count;

            // Build user list with roles
            var userList = new List<UserListItem>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userList.Add(new UserListItem
                {
                    Id = user.Id,
                    FullName = user.FullName ?? "",
                    Email = user.Email ?? "",
                    Roles = roles.ToList()
                });
            }

            return new GetUsersQueryResponse
            {
                IsSuccess = true,
                Message = "Users retrieved successfully",
                Users = userList,
                TotalCount = totalCount
            };
        }
        catch (Exception ex)
        {
            return new GetUsersQueryResponse
            {
                IsSuccess = false,
                Message = $"Error retrieving users: {ex.Message}",
                Users = new List<UserListItem>(),
                TotalCount = 0
            };
        }
    }
}
