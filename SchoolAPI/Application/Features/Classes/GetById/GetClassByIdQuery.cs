namespace SchoolAPI.Application.Features.Classes.GetById;

public record GetClassByIdQuery(Guid ClassId) : IRequest<Result<ClassDto>>;
