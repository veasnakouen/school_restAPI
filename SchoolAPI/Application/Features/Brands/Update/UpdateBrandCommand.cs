using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Brands.Update;

public record UpdateBrandCommand(string BrandId, BrandDto Brand) : IRequest<Result<BrandDto>>;
