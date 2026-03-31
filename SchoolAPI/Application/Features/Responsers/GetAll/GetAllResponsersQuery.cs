using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Responsers.GetAll;

public record GetAllResponsersQuery : IRequest<Result<List<ResponserDto>>>;
