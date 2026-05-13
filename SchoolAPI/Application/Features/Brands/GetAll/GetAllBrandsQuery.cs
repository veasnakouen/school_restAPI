using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Brands.GetAll;

public record GetAllBrandsQuery : IRequest<Result<List<BrandDto>>>;
