using MediatR;
using SchoolAPI.Data;
using System.Threading;
using System.Threading.Tasks;

public class UpdatePermissionCommandHandler : IRequestHandler<UpdatePermissionCommand, bool>
{
    private readonly SchoolDbContext _context;
    public UpdatePermissionCommandHandler(SchoolDbContext context)
    {
        _context = context;
    }
    public async Task<bool> Handle(UpdatePermissionCommand request, CancellationToken cancellationToken)
    {
        var permission = await _context.Set<SchoolAPI.Entities.Permission>().FindAsync(new object[] { request.Id }, cancellationToken);
        if (permission == null) return false;
        permission.Name = request.Name;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
