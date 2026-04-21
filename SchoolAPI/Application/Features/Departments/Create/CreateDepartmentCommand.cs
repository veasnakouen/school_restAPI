using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Departments.Create;

public record CreateDepartmentCommand(DepartmentDto DepartmentDto) : IRequest<Result<DepartmentDto>>;