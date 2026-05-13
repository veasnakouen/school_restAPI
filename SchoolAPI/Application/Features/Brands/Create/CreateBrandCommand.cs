using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Brands.Create;

public record CreateBrandCommand(BrandDto Brand) : IRequest<Result<BrandDto>>;
