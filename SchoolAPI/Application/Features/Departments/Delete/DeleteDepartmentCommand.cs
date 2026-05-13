using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Departments.Delete;

public record DeleteDepartmentCommand(string DepartmentId) : IRequest<Result>;
