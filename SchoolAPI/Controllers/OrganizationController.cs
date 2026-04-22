using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganizationController : ControllerBase
{
    // Path where the logo will be stored so QuestPDF and other services can access it
    private readonly string _logoPath = "wwwroot/images/organization-logo.png";

    public class LogoRequest
    {
        public string Base64String { get; set; } = string.Empty;
    }

    [HttpGet("Logo")]
    public IActionResult GetLogo()
    {
        if (!System.IO.File.Exists(_logoPath))
        {
            return Ok(new { base64String = "" });
        }

        var imageBytes = System.IO.File.ReadAllBytes(_logoPath);
        var base64String = Convert.ToBase64String(imageBytes);
        
        // Reconstruct the Data URL for the React frontend
        var dataUrl = $"data:image/png;base64,{base64String}";

        return Ok(new { base64String = dataUrl });
    }

    [HttpPost("Logo")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateLogo([FromBody] LogoRequest request)
    {
        if (string.IsNullOrEmpty(request.Base64String))
            return BadRequest(new { title = "Logo data is required." });

        // Strip the "data:image/png;base64," prefix before converting to bytes
        var base64Data = request.Base64String;
        var commaIndex = base64Data.IndexOf(',');
        if (commaIndex >= 0) base64Data = base64Data.Substring(commaIndex + 1);

        var imageBytes = Convert.FromBase64String(base64Data);

        // Ensure directory exists
        var directory = Path.GetDirectoryName(_logoPath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        // Save the image securely to disk
        await System.IO.File.WriteAllBytesAsync(_logoPath, imageBytes);

        return Ok(new { message = "Logo updated successfully!" });
    }
}