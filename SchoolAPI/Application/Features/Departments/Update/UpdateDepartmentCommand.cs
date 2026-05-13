using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Departments.Update;

public record UpdateDepartmentCommand(string DepartmentId, DepartmentDto Department) : IRequest<Result<DepartmentDto>>;
