using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.DTOs;

namespace SchoolAPI.Controllers
{
    // [Route("api/[controller]")]
    // [ApiController]
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
        public async Task<IActionResult> GetAllOutReach()
        {
            var outReaches = await _service.GetAllOutReachAsync();
            return Ok(outReaches);
        }

        /// <summary>
        /// Updates an outreach record.
        /// </summary>
        /// <param name="outReachId">The ID of the outreach record.</param>
        /// <param name="outReachDto">Updated outreach details.</param>
        /// <returns>Success message or error if update fails.</returns>
        [HttpPut("outreach/{outReachId}")]
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