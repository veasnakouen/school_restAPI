using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SchoolAPI.Constant;
using SchoolAPI.DTOs;
using SchoolAPI.Services;

namespace SchoolAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = Permissions.OutreachRead)]
    public class OutReachController : ControllerBase
    {
        public ClassService _service;
        public OutReachController(ClassService service)
        {
            _service = service;
        }
        // --- OutReach CRUD Endpoints ---

        /// <summary>
        /// Creates a new outreach record.
        /// </summary>
        /// <param name="outReachDto">Outreach details.</param>
        /// <returns>The created outreach record.</returns>
        [HttpPost("outreach")]
        [Authorize(Policy = Permissions.OutreachCreate)]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateOutReach([FromBody] OutReachDto outReachDto)
        {
            try
            {
                var createdOutReach = await _service.CreateOutReachAsync(outReachDto);
                return CreatedAtAction(nameof(GetOutReach), new { outReachId = createdOutReach.Id }, createdOutReach);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Retrieves an outreach record by ID.
        /// </summary>
        /// <param name="outReachId">The ID of the outreach record.</param>
        /// <returns>Outreach details or not found if outreach doesn't exist.</returns>
        [HttpGet("outreach/{outReachId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetOutReach(Guid outReachId)
        {
            if (outReachId == Guid.Empty)
            {
                return BadRequest("Invalid outreach ID.");
            }

            var outReachDto = await _service.GetOutReachAsync(outReachId);
            return outReachDto != null ? Ok(outReachDto) : NotFound("Outreach not found.");
        }

        /// <summary>
        /// Retrieves all outreach records.
        /// </summary>
        /// <returns>List of all outreach records.</returns>
        [HttpGet("outreach")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllOutReach([FromQuery] string? filterOn, [FromQuery] string? filterQuery,
        [FromQuery] string? sortBy, [FromQuery] bool? isAscending, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 3)
        {
            var outReaches = await _service.GetAllOutReachAsync(filterOn, filterQuery, sortBy, isAscending ?? true, pageNumber, pageSize);
            return Ok(outReaches);
        }

        /// <summary>
        /// Updates an outreach record.
        /// </summary>
        /// <param name="outReachId">The ID of the outreach record.</param>
        /// <param name="outReachDto">Updated outreach details.</param>
        /// <returns>Success message or error if update fails.</returns>
        [HttpPut("outreach/{outReachId}")]
        [Authorize(Policy = Permissions.OutreachUpdate)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateOutReach(Guid outReachId, [FromBody] OutReachDto outReachDto)
        {
            if (outReachId == Guid.Empty || outReachId != outReachDto.Id)
            {
                return BadRequest("Invalid outreach ID or mismatched ID in request body.");
            }

            var success = await _service.UpdateOutReachAsync(outReachId, outReachDto);
            return success ? Ok("Outreach updated successfully.") : NotFound("Outreach not found or update failed.");

        }

        /// <summary>
        /// Deletes an outreach record.
        /// </summary>
        /// <param name="outReachId">The ID of the outreach record.</param>
        /// <returns>Success message or error if deletion fails.</returns>
        [HttpDelete("outreach/{outReachId}")]
        [Authorize(Policy = Permissions.OutreachDelete)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteOutReach(Guid outReachId)
        {
            if (outReachId == Guid.Empty)
            {
                return BadRequest("Invalid outreach ID.");
            }

            var success = await _service.DeleteOutReachAsync(outReachId);
            return success ? Ok("Outreach deleted successfully.") : NotFound("Outreach not found.");
        }

    }
}