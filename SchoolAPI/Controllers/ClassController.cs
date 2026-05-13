using System.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using SchoolAPI.Constant;
using SchoolAPI.Data;
using SchoolAPI.DTOs;
using SchoolAPI.Entities;
using SchoolAPI.Services;

namespace SchoolAPI.Controllers;

[Authorize(Policy = Permissions.ClassRead)]
public class ClassController : BaseController
{

    private readonly ClassService _service;
    // private readonly ISender _sender;
    public ClassController(ClassService classService, ISender sender)
    {
        _service = classService;
        // _sender = sender;
    }

    [HttpPost("classes")]
    [Authorize(Policy = Permissions.ClassCreate)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    // public async Task<ActionResult<Guid>> CreateClass(CreateClassCommand command) //[FromBody] ClassDto classDto
    public async Task<IActionResult> CreateClass([FromBody] ClassDto classDto) //
    {
        try
        {
            var createdClass = await _service.CreateClassAsync(classDto);

            var createdClassId = createdClass.Id;
            return CreatedAtAction(nameof(GetClass), new { classId = createdClass.Id }, createdClass);
            // Using  CQRS : example
            // var createdClass = await _service.GetClassAsync(createdClassId);
            // var createdClassId = await _sender.Send(command);
            // return Ok(createdClassId);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("classes/{classId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetClass(Guid classId)
    {
        if (classId == Guid.Empty)
        {
            return BadRequest("Invalid class ID.");
        }

        var classDto = await _service.GetClassAsync(classId);
        return classDto != null ? Ok(classDto) : NotFound("Class not found.");
    }

    [HttpGet("classes")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllClasses(
        [FromQuery] string? filterOn = null,
        [FromQuery] string? filterQuery = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool isAscending = true,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var classes = await _service.GetAllClasses(filterOn, filterQuery, sortBy, isAscending, pageNumber, pageSize);
        return Ok(classes);
    }

    [HttpPut("classes/{classId}")]
    [Authorize(Policy = Permissions.ClassUpdate)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateClass(Guid classId, [FromBody] ClassDto classDto)
    {
        if (classId == Guid.Empty || classId != classDto.Id)
        {
            return BadRequest("Invalid class ID or mismatched ID in request body.");
        }

        var success = await _service.UpdateClassAsync(classId, classDto);
        return success ? Ok("Class updated successfully.") : NotFound("Class not found or update failed.");
    }


    [HttpDelete("classes/{classId}")]
    [Authorize(Policy = Permissions.ClassDelete)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteClass(Guid classId)
    {
        if (classId == Guid.Empty)
        {
            return BadRequest("Invalid class room ID.");
        }

        var existingClass = await _service.GetClassAsync(classId);
        if (existingClass == null)
        {
            return NotFound("Class Room not found.");
        }

        var success = await _service.DeleteClassAsync(classId);
        return success ? Ok("ClassRoom has been deleted successfully.") : NotFound("Class Room not found.");
    }


}

public class SeedController : BaseController
{

    private readonly SchoolDbContext _context;
    private readonly IWebHostEnvironment _env;
    public SeedController(SchoolDbContext context, IWebHostEnvironment env)
    {
        _env = env;
        _context = context;
    }

    // TODO: 
    [HttpGet]
    [Route("seed-data")]
    public async Task<IActionResult> SeedData()
    {

        // Seed initial data
        if (!_env.IsDevelopment())
            throw new SecurityException("Not allowed!");

        var path = Path.Combine(_env.ContentRootPath, "Data/Source/Students.xlsx");

        // create alias  for file stream
        using var stream = System.IO.File.OpenRead(path);
        using var excelPackage = new ExcelPackage(stream);// create alias (excel) package from stream

        //get the first worksheet in the excel file
        var worksheet = excelPackage.Workbook.Worksheets[0];
        var rowCount = worksheet.Dimension.Rows;

        for (int row = 2; row <= rowCount; row++) // assuming first row is header
        {
            var student = new Student
            {
                KhFirstName = worksheet.Cells[row, 1].Text,
                KhLastName = worksheet.Cells[row, 2].Text,
                DateOfBirth = DateTime.Parse(worksheet.Cells[row, 3].Text),
                EngFirstName = worksheet.Cells[row, 4].Text,
                EngLastName = worksheet.Cells[row, 5].Text
            };

            _context.Students.Add(student);
        }

        await _context.SaveChangesAsync();

        return Ok("Data seeded successfully.");
    }
}


