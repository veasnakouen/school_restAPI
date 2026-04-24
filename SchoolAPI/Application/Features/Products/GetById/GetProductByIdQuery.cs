using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

public record GetProductByIdQuery(string ProductId) : IRequest<Result<ProductDto>>;