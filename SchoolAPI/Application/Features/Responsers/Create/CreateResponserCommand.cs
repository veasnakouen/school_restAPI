using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Responsers.Create;

public record CreateResponserCommand(ResponserDto Responser) : IRequest<Result<ResponserDto>>;
