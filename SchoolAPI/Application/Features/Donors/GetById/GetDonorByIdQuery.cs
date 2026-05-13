using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Donors.GetById;

public record GetDonorByIdQuery(string DonorId) : IRequest<Result<DonorDto>>;
