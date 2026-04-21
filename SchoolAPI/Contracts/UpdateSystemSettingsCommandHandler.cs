using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Settings.Update;

public class UpdateSystemSettingsCommandHandler : IRequestHandler<UpdateSystemSettingsCommand, Result<SystemSettingsDto>>
{
    private readonly IApplicationDbContext _context;

    public UpdateSystemSettingsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<SystemSettingsDto>> Handle(UpdateSystemSettingsCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;
        var settings = await _context.SystemSettings.FirstOrDefaultAsync(cancellationToken);

        if (settings == null)
        {
            settings = new SystemSetting { Id = Guid.NewGuid() };
            _context.SystemSettings.Add(settings);
        }

        settings.SiteName = req.SiteName;
        settings.ContactEmail = req.ContactEmail;
        settings.AllowRegistration = req.AllowRegistration;
        settings.RequireEmailVerification = req.RequireEmailVerification;
        settings.MaintenanceMode = req.MaintenanceMode;
        settings.DefaultToDarkMode = req.DefaultToDarkMode;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<SystemSettingsDto>.Success(new SystemSettingsDto
        {
            SiteName = settings.SiteName,
            ContactEmail = settings.ContactEmail,
            AllowRegistration = settings.AllowRegistration,
            RequireEmailVerification = settings.RequireEmailVerification,
            MaintenanceMode = settings.MaintenanceMode,
            DefaultToDarkMode = settings.DefaultToDarkMode
        });
    }
}