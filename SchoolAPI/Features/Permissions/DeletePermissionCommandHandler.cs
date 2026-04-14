using MediatR;
using SchoolAPI.Data;
using System.Threading;
using System.Threading.Tasks;

public class DeletePermissionCommandHandler : IRequestHandler<DeletePermissionCommand, bool>
{
    private readonly SchoolDbContext _context;
    public DeletePermissionCommandHandler(SchoolDbContext context)
    {
        _context = context;
    }
    public async Task<bool> Handle(DeletePermissionCommand request, CancellationToken cancellationToken)
    {
        var permission = await _context.Set<SchoolAPI.Entities.Permission>().FindAsync(new object[] { request.Id }, cancellationToken);
        if (permission == null) return false;
        _context.Set<SchoolAPI.Entities.Permission>().Remove(permission);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
