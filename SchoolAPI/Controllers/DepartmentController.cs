using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Application.Features.Departments.Create;
using SchoolAPI.Application.Features.Departments.GetAll;
using SchoolAPI.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Constant;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DepartmentController : BaseController
    {
        private readonly ISender _sender;

        public DepartmentController(ISender sender)
        {
            _sender = sender;
        }

        [HttpGet]
        [Authorize(Policy = Permissions.DepartmentRead)]
        public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
        {
            var query = new GetAllDepartmentsQuery();
            var result = await _sender.Send(query, cancellationToken);
            return HandleResult(result);
        }

        [HttpPost]
        [Authorize(Policy = Permissions.DepartmentCreate)]
        public async Task<IActionResult> Create([FromBody] DepartmentDto request, CancellationToken cancellationToken)
        {
            var command = new CreateDepartmentCommand(request);
            var result = await _sender.Send(command, cancellationToken);
            if (!result.IsSuccess) return HandleResult(result);
            return CreatedAtAction(nameof(GetAll), new { id = result.Data?.Id }, result.Data);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Permissions.DepartmentUpdate)]
        public async Task<IActionResult> Update(string id, [FromBody] DepartmentDto request, [FromServices] IApplicationDbContext context, CancellationToken cancellationToken)
        {
            var dept = await context.Departments.FindAsync(new object[] { id }, cancellationToken);
            if (dept == null) return NotFound(new { message = "Department not found." });
            
            dept.Name = request.Name;
            await context.SaveChangesAsync(cancellationToken);
            return Ok(dept);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Permissions.DepartmentDelete)]
        public async Task<IActionResult> Delete(string id, [FromServices] IApplicationDbContext context, CancellationToken cancellationToken)
        {
            var dept = await context.Departments.FindAsync(new object[] { id }, cancellationToken);
            if (dept == null) return NotFound(new { message = "Department not found." });
            context.Departments.Remove(dept);
            
            try
            {
                await context.SaveChangesAsync(cancellationToken);
                return Ok(new { message = "Department deleted successfully." });
            }
            catch (DbUpdateException)
            {
                return BadRequest(new { message = "Cannot delete this item because it is currently in use by other records (e.g., assigned to a product)." });
            }
        }
    }
}