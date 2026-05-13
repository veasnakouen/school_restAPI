using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Donors.GetAll;

public record GetAllDonorsQuery : IRequest<Result<List<DonorDto>>>;
