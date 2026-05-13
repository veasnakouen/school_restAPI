using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Products.Delete;

public record DeleteProductCommand(string ProductId) : IRequest<Result>;
