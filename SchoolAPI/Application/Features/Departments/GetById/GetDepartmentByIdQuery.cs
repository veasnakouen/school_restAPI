using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Departments.GetById;

public record GetDepartmentByIdQuery(string DepartmentId) : IRequest<Result<DepartmentDto>>;
