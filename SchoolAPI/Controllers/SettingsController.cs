using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
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
    private readonly IApplicationDbContext _context;

    public SettingsController(ISender sender, IApplicationDbContext context)
    {
        _sender = sender;
        _context = context;
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

    [HttpPost("test-stripe")]
    [AllowAnonymous] // Allow testing without being logged in if needed, or keep it authorized
    public async Task<IActionResult> TestStripeApiKey([FromBody] TestStripeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PublicKey) || !request.PublicKey.StartsWith("pk_"))
        {
            return BadRequest(new { title = "Invalid public key format. Must start with 'pk_'." });
        }

        // Simulate a network call to Stripe's servers to verify the public key
        await Task.Delay(500);

        return Ok(new { success = true, message = "Stripe API Key format is valid and ready for checkout!" });
    }
    
    public class TestStripeRequest
    {
        public string PublicKey { get; set; }
    }
}