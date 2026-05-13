using MediatR;
using SchoolAPI.Entities;
using SchoolAPI.Data;
using System.Threading;
using System.Threading.Tasks;

public class GetPermissionByIdQueryHandler : IRequestHandler<GetPermissionByIdQuery, Permission?>
{
    private readonly SchoolDbContext _context;
    public GetPermissionByIdQueryHandler(SchoolDbContext context)
    {
        _context = context;
    }
    public async Task<Permission?> Handle(GetPermissionByIdQuery request, CancellationToken cancellationToken)
    {
        return await _context.Set<Permission>().FindAsync(new object[] { request.Id }, cancellationToken);
    }
}
