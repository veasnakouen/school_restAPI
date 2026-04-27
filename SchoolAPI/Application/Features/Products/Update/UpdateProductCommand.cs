using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Products.Update;

public record UpdateProductCommand(string Id, ProductDto ProductDto) : IRequest<Result<ProductDto>>;