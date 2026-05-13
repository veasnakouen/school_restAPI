using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Categories.Create;

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, Result<CategoryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CreateCategoryCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        if (request.Category == null)
        {
            return Result<CategoryDto>.Failure("Category data is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Category.Name))
        {
            return Result<CategoryDto>.Failure("Category name is required.");
        }

        var name = request.Category.Name.Trim();
        var exists = await _context.Categories.AnyAsync(x => x.Name == name, cancellationToken);
        if (exists)
        {
            return Result<CategoryDto>.Failure("Category already exists.");
        }

        var category = _mapper.Map<Category>(request.Category);
        category.Id = Guid.NewGuid().ToString();
        category.Name = name;
        category.CreatedDate = DateTime.UtcNow;
        category.UpdateDate = null;

        _context.Categories.Add(category);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<CategoryDto>.Success(_mapper.Map<CategoryDto>(category));
    }
}
