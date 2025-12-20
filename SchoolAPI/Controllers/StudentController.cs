using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Build.Framework;
using SchoolAPI.DTOs;
using SchoolAPI.Entities;

namespace SchoolAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
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
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllStudents()
        {
            var students = await _service.GetAllStudentsAsync();
            return Ok(students);
        }

        /// <summary>
        /// Updates a student.
        /// </summary>
        /// <param name="studentId">The ID of the student.</param>
        /// <param name="studentDto">Updated student details.</param>
        /// <returns>Success message or error if update fails.</returns>
        [HttpPut("students/{studentId}")]
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
        
    }
}