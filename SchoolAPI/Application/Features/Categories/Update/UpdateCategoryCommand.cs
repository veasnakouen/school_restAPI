using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Categories.Update;

public record UpdateCategoryCommand(string CategoryId, CategoryDto Category) : IRequest<Result<CategoryDto>>;
