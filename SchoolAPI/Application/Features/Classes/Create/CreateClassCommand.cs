using SchoolAPI.Domain.Entities;

namespace SchoolAPI.Application.Features.Classes.Create;

public record CreateClassCommand(string ClassName) : IRequest<Result<Guid>>;
