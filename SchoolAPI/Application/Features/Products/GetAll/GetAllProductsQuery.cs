using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Products.GetAll;

public record GetAllProductsQuery : IRequest<Result<List<ProductDto>>>;
