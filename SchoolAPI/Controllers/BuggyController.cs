
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
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



}