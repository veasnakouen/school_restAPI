using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Donors.Delete;

public record DeleteDonorCommand(string DonorId) : IRequest<Result>;
