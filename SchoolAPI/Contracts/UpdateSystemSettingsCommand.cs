using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Settings.Update;

public record UpdateSystemSettingsCommand(SystemSettingsDto Request) : IRequest<Result<SystemSettingsDto>>;