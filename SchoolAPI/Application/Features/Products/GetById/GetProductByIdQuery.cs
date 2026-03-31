using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Products.GetById;

public record GetProductByIdQuery(string ProductId) : IRequest<Result<ProductDto>>;
