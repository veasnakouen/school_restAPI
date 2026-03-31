using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Brands.GetById;

public record GetBrandByIdQuery(string BrandId) : IRequest<Result<BrandDto>>;
