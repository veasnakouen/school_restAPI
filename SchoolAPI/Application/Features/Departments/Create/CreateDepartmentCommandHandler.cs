using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Departments.Create;

public class CreateDepartmentCommandHandler : IRequestHandler<CreateDepartmentCommand, Result<DepartmentDto>>
{
    private readonly IApplicationDbContext _context;

    public CreateDepartmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<DepartmentDto>> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        var dto = request.DepartmentDto;

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return Result<DepartmentDto>.Failure("Department name cannot be empty.");
        }

        var existingDepartment = await _context.Departments
            .FirstOrDefaultAsync(d => EF.Functions.ILike(d.Name, dto.Name), cancellationToken);

        if (existingDepartment != null)
        {
            return Result<DepartmentDto>.Failure($"A department with the name '{dto.Name}' already exists.");
        }

        var department = new Department { Id = Guid.NewGuid().ToString(), Name = dto.Name, Location = "" };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync(cancellationToken);

        dto.Id = department.Id;
        return Result<DepartmentDto>.Success(dto);
    }
}