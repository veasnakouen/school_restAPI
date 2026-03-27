namespace SchoolAPI.Application.Features.Classes.GetAll;

public record GetAllClassesQuery : IRequest<Result<List<ClassDto>>>;
