using Microsoft.AspNetCore.Mvc;
using MediatR;
using SchoolAPI.Application.Features.Permissions.GetAll;
using Microsoft.AspNetCore.Authorization;

namespace SchoolAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PermissionsController : BaseController
    {
        private readonly IMediator _mediator;
        public PermissionsController(IMediator mediator)
        {
            _mediator = mediator;
        }
        
        [HttpGet]
        public async Task<IActionResult> GetPermissions()
        {
            var permissions = await _mediator.Send(new GetPermissionsQuery());
            return HandleResult(permissions);
        }
        // The other endpoints (GetById, Create, Update, Delete) are not used by the frontend
        // and seem to be from a previous implementation pattern. They can be removed or refactored later.
    }
}
