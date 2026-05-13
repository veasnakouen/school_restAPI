using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Responsers.GetById;

public record GetResponserByIdQuery(string ResponserId) : IRequest<Result<ResponserDto>>;
