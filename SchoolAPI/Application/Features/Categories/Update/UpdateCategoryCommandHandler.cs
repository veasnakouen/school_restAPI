using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Categories.Update;

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, Result<CategoryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public UpdateCategoryCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CategoryId))
        {
            return Result<CategoryDto>.Failure("Invalid category ID.");
        }

        if (request.Category == null)
        {
            return Result<CategoryDto>.Failure("Category data is required.");
        }

        var category = await _context.Categories.FirstOrDefaultAsync(x => x.Id == request.CategoryId, cancellationToken);
        if (category == null)
        {
            return Result<CategoryDto>.Failure("Category not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Category.Name))
        {
            return Result<CategoryDto>.Failure("Category name is required.");
        }

        var name = request.Category.Name.Trim();
        var duplicate = await _context.Categories.AnyAsync(x => x.Id != request.CategoryId && x.Name == name, cancellationToken);
        if (duplicate)
        {
            return Result<CategoryDto>.Failure("Category already exists.");
        }

        category.Name = name;
        category.UpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<CategoryDto>.Success(_mapper.Map<CategoryDto>(category));
    }
}
