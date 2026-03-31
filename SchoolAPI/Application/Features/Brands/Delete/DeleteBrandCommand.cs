using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Brands.Delete;

public record DeleteBrandCommand(string BrandId) : IRequest<Result>;
