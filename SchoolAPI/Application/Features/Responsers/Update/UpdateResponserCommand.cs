using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Responsers.Update;

public record UpdateResponserCommand(string ResponserId, ResponserDto Responser) : IRequest<Result<ResponserDto>>;
