using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Donors.Update;

public record UpdateDonorCommand(string DonorId, DonorDto Donor) : IRequest<Result<DonorDto>>;
