using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Settings.Get;

public class GetSystemSettingsQueryHandler : IRequestHandler<GetSystemSettingsQuery, Result<SystemSettingsDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSystemSettingsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<SystemSettingsDto>> Handle(GetSystemSettingsQuery request, CancellationToken cancellationToken)
    {
        var settings = await _context.SystemSettings.FirstOrDefaultAsync(cancellationToken);
        
        if (settings == null)
        {
            return Result<SystemSettingsDto>.Success(new SystemSettingsDto { SiteName = "School Management System", ContactEmail = "admin@school.com", AllowRegistration = true, DefaultToDarkMode = false });
        }

        return Result<SystemSettingsDto>.Success(new SystemSettingsDto
        {
            SiteName = settings.SiteName,
            ContactEmail = settings.ContactEmail,
            AllowRegistration = settings.AllowRegistration,
            RequireEmailVerification = settings.RequireEmailVerification,
            MaintenanceMode = settings.MaintenanceMode,
            DefaultToDarkMode = settings.DefaultToDarkMode,
            LogoBase64 = settings.LogoBase64,
            BankQrCodeBase64 = settings.BankQrCodeBase64,
            ProductExportFields = settings.ProductExportFields
        });
    }
}