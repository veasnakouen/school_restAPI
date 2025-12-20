using Microsoft.AspNetCore.Mvc;

namespace SchoolAPI.Entities;

[ApiController]
[Route("api/[controller]")]
public class BaseController : ControllerBase
{
    // This class can be extended by other controllers to inherit common functionality
    // Just for reduce redundancy ([ApiController] and [Route] attributes)
}