using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.DTOs;

namespace SchoolAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EnrollController : ControllerBase
    {
        private readonly ClassService _service;
        public EnrollController(ClassService service)
        {
            _service = service;
        }
        

        /// <summary>
    /// Enrolls a student in a class.
    /// </summary>
    /// <param name="studentId">The ID of the student.</param>
    /// <param name="classId">The ID of the class.</param>
    /// <returns>Success message or error if enrollment fails.</returns>
    [HttpPost("enroll")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> EnrollStudent(Guid studentId, Guid classId)
    {
        if (studentId == Guid.Empty || classId == Guid.Empty)
        {
            return BadRequest("Invalid student or class ID.");
        }

        var success = await _service.EnrollStudentAsync(studentId, classId);
        return success ? Ok("Student enrolled successfully.") : BadRequest("Enrollment failed. Student or class not found, or student already enrolled.");
    }

    /// <summary>
    /// Removes a student from their class.
    /// </summary>
    /// <param name="studentId">The ID of the student.</param>
    /// <returns>Success message or error if removal fails.</returns>
    [HttpDelete("remove")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoveStudent(Guid studentId)
    {
        if (studentId == Guid.Empty)
        {
            return BadRequest("Invalid student ID.");
        }

        var success = await _service.RemoveStudentAsync(studentId);
        return success ? Ok("Student removed from class successfully.") : BadRequest("Removal failed. Student not found or not enrolled.");
    }

    /// <summary>
    /// Marks attendance for a student in a class.
    /// </summary>
    /// <param name="attendanceDto">Attendance details (student ID, class ID, date, status).</param>
    /// <returns>Success message or error if marking fails.</returns>
    [HttpPost("attendance")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MarkAttendance([FromBody] AttendanceDto attendanceDto)
    {
        if (attendanceDto == null ||
            attendanceDto.StudentId == Guid.Empty ||
            attendanceDto.ClassId == Guid.Empty ||
            attendanceDto.Date == default)
        {
            return BadRequest("Invalid attendance data. Ensure StudentId, ClassId, and Date are provided.");
        }

        var success = await _service.MarkAttendanceAsync(attendanceDto);
        return success ? Ok("Attendance marked successfully.") : BadRequest("Failed to mark attendance. Student not enrolled, class not found, or attendance already recorded.");
    }

    /// <summary>
    /// Retrieves attendance records for a student in a class, optionally filtered by date range.
    /// </summary>
    /// <param name="studentId">The ID of the student.</param>
    /// <param name="classId">The ID of the class.</param>
    /// <param name="startDate">Optional start date for filtering.</param>
    /// <param name="endDate">Optional end date for filtering.</param>
    /// <returns>List of attendance records.</returns>
    [HttpGet("students/{studentId}/attendance")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetStudentAttendance(Guid studentId, Guid classId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        if (studentId == Guid.Empty || classId == Guid.Empty)
        {
            return BadRequest("Invalid student or class ID.");
        }

        var attendance = await _service.GetStudentAttendanceAsync(studentId, classId, startDate, endDate);
        return Ok(attendance);
    }

    /// <summary>
    /// Retrieves attendance records for all students in a class on a specific date.
    /// </summary>
    /// <param name="classId">The ID of the class.</param>
    /// <param name="date">The date to check attendance for.</param>
    /// <returns>List of attendance records.</returns>
    [HttpGet("classes/{classId}/attendance/{date}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetClassAttendance(Guid classId, DateTime date)
    {
        if (classId == Guid.Empty || date == default)
        {
            return BadRequest("Invalid class ID or date.");
        }

        var attendance = await _service.GetClassAttendanceAsync(classId, date);
        return Ok(attendance);
    }
    }
}