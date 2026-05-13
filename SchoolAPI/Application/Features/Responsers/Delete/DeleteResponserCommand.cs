using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Responsers.Delete;

public record DeleteResponserCommand(string ResponserId) : IRequest<Result>;
