using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Models;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SchoolAPI.Extensions;

public static class PaginationExtensions
{
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var totalCount = await query.CountAsync(cancellationToken);

        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : pageSize;

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<T> { Items = items, TotalCount = totalCount, PageNumber = pageNumber, PageSize = pageSize };
    }
}