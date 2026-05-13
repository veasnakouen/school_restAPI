using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using SchoolAPI.Entities;

namespace SchoolAPI.Controllers;

public class BuggyController : BaseController
{
    [HttpGet("not-found")]
    public ActionResult GetNotFound()
    {
        // throw new DomainException("This is a not found error");
        return NotFound();
    }

    [HttpGet("server-error")]
    public ActionResult GetServerError()
    {
        throw new Exception("This is a server error");
    }

    [HttpGet("bad-request")]
    public ActionResult GetBadRequest()
    {
        return BadRequest("This was not a good request");
    }

    [HttpGet("unauthorized")]
    public IActionResult GetUnauthorized()
    {
        return Unauthorized();
    }
    [HttpGet("validation-error")]
    public IActionResult GetValidationError()
    {
        ModelState.AddModelError("Problems1","This is the first Error"); 
        ModelState.AddModelError("Problem2","This is the second errors."); 
        return ValidationProblem();
    }

}
