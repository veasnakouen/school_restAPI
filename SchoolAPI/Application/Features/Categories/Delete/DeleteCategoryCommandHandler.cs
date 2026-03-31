using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Categories.Delete;

public class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeleteCategoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CategoryId))
        {
            return Result.Failure("Invalid category ID.");
        }

        var category = await _context.Categories.FirstOrDefaultAsync(x => x.Id == request.CategoryId, cancellationToken);
        if (category == null)
        {
            return Result.Failure("Category not found.");
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
