using MediatR;
using SchoolAPI.Entities;
using SchoolAPI.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

public class GetPermissionsQueryHandler : IRequestHandler<GetPermissionsQuery, List<Permission>>
{
    private readonly SchoolDbContext _context;
    public GetPermissionsQueryHandler(SchoolDbContext context)
    {
        _context = context;
    }
    public async Task<List<Permission>> Handle(GetPermissionsQuery request, CancellationToken cancellationToken)
    {
        return await _context.Set<Permission>().ToListAsync(cancellationToken);
    }
}
