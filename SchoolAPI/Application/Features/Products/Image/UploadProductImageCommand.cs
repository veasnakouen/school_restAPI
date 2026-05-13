using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Products.Image;

public record UploadProductImageCommand(string ProductId, IFormFile File) : IRequest<Result<ProductDto>>;