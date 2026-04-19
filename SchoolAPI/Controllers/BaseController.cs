
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BaseController : ControllerBase
{
    /// <summary>
    /// Handles the result of a CQRS command/query and returns an appropriate IActionResult.
    /// </summary>
    /// <typeparam name="T">The type of the data in the result.</typeparam>
    /// <param name="result">The result object from a handler.</param>
    /// <returns>An IActionResult representing the outcome.</returns>
    protected IActionResult HandleResult<T>(Result<T> result)
    {
        if (result is null)
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred: Result was null." });

        if (result.IsSuccess)
            return Ok(result.Data);

        if (result.ErrorMessage.Contains("not found", StringComparison.OrdinalIgnoreCase))
            return NotFound(new { message = result.ErrorMessage });

        return BadRequest(new { message = result.ErrorMessage });
    }
}