using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.DTOs;

namespace SchoolAPI.Application.Features.Classes.GetAll;

public record GetAllClassesQuery : IRequest<Result<List<ClassDto>>>;
