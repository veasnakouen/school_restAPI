
using Microsoft.AspNetCore.Mvc;
using MediatR;
using SchoolAPI.Entities;

namespace SchoolAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PermissionsController : ControllerBase
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
            return Ok(permissions);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPermission(int id)
        {
            var permission = await _mediator.Send(new GetPermissionByIdQuery(id));
            if (permission == null) return NotFound();
            return Ok(permission);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePermission([FromBody] Permission permission)
        {
            var created = await _mediator.Send(new CreatePermissionCommand(permission));
            return CreatedAtAction(nameof(GetPermission), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePermission(int id, [FromBody] Permission permission)
        {
            var result = await _mediator.Send(new UpdatePermissionCommand(id, permission.Name));
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePermission(int id)
        {
            var result = await _mediator.Send(new DeletePermissionCommand(id));
            if (!result) return NotFound();
            return NoContent();
        }
    }
}
