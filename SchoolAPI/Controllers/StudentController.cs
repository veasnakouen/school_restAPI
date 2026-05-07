using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Constant;
using SchoolAPI.DTOs;
using SchoolAPI.Entities;
using SchoolAPI.Services;

namespace SchoolAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = Permissions.StudentRead)]
    public class StudentController : ControllerBase
    {
        private readonly ClassService _service;
        private readonly ILogger<AppUser> _logger;

        public StudentController(ClassService service, ILogger<AppUser> logger)
        {
            _service = service;
            _logger = logger;
        }
        // --- Student CRUD Endpoints ---

        /// <summary>
        /// Creates a new student.
        /// </summary>
        /// <param name="studentDto">Student details.</param>
        /// <returns>The created student.</returns>
        [HttpPost("students")]
        [Authorize(Policy = Permissions.StudentCreate)]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateStudent([FromBody] StudentDto studentDto)
        {
            try
            {
                if (studentDto == null)
                {
                    return BadRequest("Student data is null!");
                }

                var createdStudent = await _service.CreateStudentAsync(studentDto);
                return CreatedAtAction(nameof(GetStudent), new { studentId = createdStudent.Id }, createdStudent);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument when creating student :{Message}", ex.Message);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpect error while creating student.");
                return StatusCode(500, "An interval error occurred. Please check the logs.");
            }
        }

        /// <summary>
        /// Retrieves a student by ID.
        /// </summary>
        /// <param name="studentId">The ID of the student.</param>
        /// <returns>Student details or not found if student doesn't exist.</returns>
        [HttpGet("students/{studentId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetStudent(Guid studentId)
        {
            if (studentId == Guid.Empty)
            {
                return BadRequest("Invalid student ID.");
            }

            var studentDto = await _service.GetStudentAsync(studentId);
            return studentDto != null ? Ok(studentDto) : NotFound("Student not found.");
        }

        /// <summary>
        /// Retrieves all students.
        /// </summary>
        /// <returns>List of all students.</returns>
        [HttpGet("students")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllStudents(
            [FromQuery] string? filterOn = null,
            [FromQuery] string? filterQuery = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool isAscending = true,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var students = await _service.GetAllStudentsAsync(filterOn, filterQuery, sortBy, isAscending, pageNumber, pageSize);
            return Ok(students);
        }

        /// <summary>
        /// Updates a student.
        /// </summary>
        /// <param name="studentId">The ID of the student.</param>
        /// <param name="studentDto">Updated student details.</param>
        /// <returns>Success message or error if update fails.</returns>
        [HttpPut("students/{studentId}")]
        [Authorize(Policy = Permissions.StudentUpdate)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateStudent(Guid studentId, [FromBody] StudentDto studentDto)
        {
            if (studentId == Guid.Empty || studentId != studentDto.Id)
            {
                return BadRequest("Invalid student ID or mismatched ID in request body.");
            }

            var success = await _service.UpdateStudentAsync(studentId, studentDto);
            return success ? Ok("Student updated successfully.") : NotFound("Student not found or update failed.");
        }

        /// <summary>
        /// Deletes a student.
        /// </summary>
        /// <param name="studentId">The ID of the student.</param>
        /// <returns>Success message or error if deletion fails.</returns>
        [HttpDelete("students/{studentId}")]
        [Authorize(Policy = Permissions.StudentDelete)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteStudent(Guid studentId)
        {
            if (studentId == Guid.Empty)
            {
                return BadRequest("Invalid student ID.");
            }

            var success = await _service.DeleteStudentAsync(studentId);
            return success ? Ok("Student deleted successfully.") : NotFound("Student not found.");
        }

        /// <summary>
        /// Uploads student image.
        /// </summary>
        /// <param name="studentId">The ID of the student.</param>
        /// <param name="file">Image file.</param>
        /// <returns>Updated student with image URL.</returns>
        [HttpPost("students/{studentId}/image")]
        [Authorize(Policy = Permissions.StudentUpdate)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UploadStudentImage(Guid studentId, IFormFile file)
        {
            if (studentId == Guid.Empty)
                return BadRequest("Invalid student ID.");
            if (file == null || file.Length == 0)
                return BadRequest("No file provided.");

            var result = await _service.UploadStudentImageAsync(studentId, file);
            return result != null ? Ok(result) : NotFound("Student not found.");
        }

    }
}