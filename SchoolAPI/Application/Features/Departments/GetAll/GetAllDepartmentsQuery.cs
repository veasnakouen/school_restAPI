using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Departments.GetAll;

public record GetAllDepartmentsQuery : IRequest<Result<List<DepartmentDto>>>;
