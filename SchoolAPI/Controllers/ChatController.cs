using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;

namespace SchoolAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
[ApiExplorerSettings(IgnoreApi = true)]
public class ChatController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public ChatController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadAttachment(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

        var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "chat-attachments");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new { url = $"/chat-attachments/{uniqueFileName}", name = file.FileName });
    }
}