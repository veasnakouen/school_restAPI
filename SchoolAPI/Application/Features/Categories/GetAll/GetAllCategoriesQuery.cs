using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Categories.GetAll;

public record GetAllCategoriesQuery : IRequest<Result<List<CategoryDto>>>;
