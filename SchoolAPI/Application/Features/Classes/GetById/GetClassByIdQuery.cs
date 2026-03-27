using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.DTOs;

namespace SchoolAPI.Application.Features.Classes.GetById;

public record GetClassByIdQuery(Guid ClassId) : IRequest<Result<ClassDto>>;
