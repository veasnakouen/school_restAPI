using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Classes.Create;

public record CreateClassCommand(string ClassName) : IRequest<Result<Guid>>;