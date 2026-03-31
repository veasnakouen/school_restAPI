using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Categories.Delete;

public record DeleteCategoryCommand(string CategoryId) : IRequest<Result>;
