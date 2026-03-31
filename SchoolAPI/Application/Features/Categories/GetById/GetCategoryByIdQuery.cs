using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Categories.GetById;

public record GetCategoryByIdQuery(string CategoryId) : IRequest<Result<CategoryDto>>;
