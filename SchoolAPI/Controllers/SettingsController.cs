using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Application.Features.Settings.Get;
using SchoolAPI.Application.Features.Settings.Update;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[Route("api/settings")]
[ApiController]
[Authorize(Roles = "Admin,SuperAdmin")] // Protect updates to only Admins
public class SettingsController : BaseController
{
    private readonly ISender _sender;

    public SettingsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [AllowAnonymous] // We leave GET public so the frontend login/register pages can check "SiteName" and "AllowRegistration" without being logged in!
    public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetSystemSettingsQuery(), cancellationToken);
        return HandleResult(result);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] SystemSettingsDto request, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new UpdateSystemSettingsCommand(request), cancellationToken);
        return HandleResult(result);
    }
}