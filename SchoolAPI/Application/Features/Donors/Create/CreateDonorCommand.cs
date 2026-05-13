using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Donors.Create;

public record CreateDonorCommand(DonorDto Donor) : IRequest<Result<DonorDto>>;
