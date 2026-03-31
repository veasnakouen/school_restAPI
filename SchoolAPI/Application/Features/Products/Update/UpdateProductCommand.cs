using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Products.Update;

public record UpdateProductCommand(string ProductId, ProductDto Product) : IRequest<Result<ProductDto>>;
