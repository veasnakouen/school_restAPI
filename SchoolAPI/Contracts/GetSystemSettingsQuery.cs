using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Settings.Get;

public record GetSystemSettingsQuery() : IRequest<Result<SystemSettingsDto>>;