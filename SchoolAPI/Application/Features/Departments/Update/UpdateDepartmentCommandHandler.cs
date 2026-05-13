using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Departments.Update;

public class UpdateDepartmentCommandHandler : IRequestHandler<UpdateDepartmentCommand, Result<DepartmentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public UpdateDepartmentCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<DepartmentDto>> Handle(UpdateDepartmentCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DepartmentId))
        {
            return Result<DepartmentDto>.Failure("Invalid department ID.");
        }

        if (request.Department == null)
        {
            return Result<DepartmentDto>.Failure("Department data is required.");
        }

        var department = await _context.Departments.FirstOrDefaultAsync(x => x.Id == request.DepartmentId, cancellationToken);
        if (department == null)
        {
            return Result<DepartmentDto>.Failure("Department not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Department.Name))
        {
            return Result<DepartmentDto>.Failure("Department name is required.");
        }

        var name = request.Department.Name.Trim();
        var duplicate = await _context.Departments.AnyAsync(x => x.Id != request.DepartmentId && x.Name == name, cancellationToken);
        if (duplicate)
        {
            return Result<DepartmentDto>.Failure("Department already exists.");
        }

        department.Name = name;
        department.Location = request.Department.Location?.Trim() ?? string.Empty;
        department.UpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<DepartmentDto>.Success(_mapper.Map<DepartmentDto>(department));
    }
}
