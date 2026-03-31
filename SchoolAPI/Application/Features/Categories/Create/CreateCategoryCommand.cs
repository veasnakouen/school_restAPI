using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Categories.Create;

public record CreateCategoryCommand(CategoryDto Category) : IRequest<Result<CategoryDto>>;
