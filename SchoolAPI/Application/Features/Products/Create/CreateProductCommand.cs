using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Products.Create;

public record CreateProductCommand(ProductDto ProductDto) : IRequest<Result<ProductDto>>;