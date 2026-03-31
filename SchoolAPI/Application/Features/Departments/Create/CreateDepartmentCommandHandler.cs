using AutoMapper;
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
    private readonly IMapper _mapper;

    public CreateDepartmentCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<DepartmentDto>> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        if (request.Department == null)
        {
            return Result<DepartmentDto>.Failure("Department data is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Department.Name))
        {
            return Result<DepartmentDto>.Failure("Department name is required.");
        }

        var name = request.Department.Name.Trim();
        var exists = await _context.Departments.AnyAsync(x => x.Name == name, cancellationToken);
        if (exists)
        {
            return Result<DepartmentDto>.Failure("Department already exists.");
        }

        var department = _mapper.Map<Department>(request.Department);
        department.Id = Guid.NewGuid().ToString();
        department.Name = name;
        department.Location = request.Department.Location?.Trim() ?? string.Empty;
        department.CreatedDate = DateTime.UtcNow;
        department.UpdateDate = null;

        _context.Departments.Add(department);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<DepartmentDto>.Success(_mapper.Map<DepartmentDto>(department));
    }
}
