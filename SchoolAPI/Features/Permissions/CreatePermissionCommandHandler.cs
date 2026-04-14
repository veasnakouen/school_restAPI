using MediatR;
using SchoolAPI.Entities;
using SchoolAPI.Data;
using System.Threading;
using System.Threading.Tasks;

public class CreatePermissionCommandHandler : IRequestHandler<CreatePermissionCommand, Permission>
{
    private readonly SchoolDbContext _context;
    public CreatePermissionCommandHandler(SchoolDbContext context)
    {
        _context = context;
    }
    public async Task<Permission> Handle(CreatePermissionCommand request, CancellationToken cancellationToken)
    {
        _context.Set<Permission>().Add(request.Permission);
        await _context.SaveChangesAsync(cancellationToken);
        return request.Permission;
    }
}
