using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Application.Features.Departments.Create;
using SchoolAPI.Application.Features.Departments.GetAll;
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
    }
}