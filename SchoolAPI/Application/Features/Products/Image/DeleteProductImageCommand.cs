using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Products.Image;

public record DeleteProductImageCommand(string ProductId) : IRequest<Result<ProductDto>>;