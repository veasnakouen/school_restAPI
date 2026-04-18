using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Data;
using SchoolAPI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SchoolAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentController : ControllerBase
    {
        private readonly SchoolDbContext _context;

        public DepartmentController(SchoolDbContext context)
        {
            _context = context;
        }

        // GET: api/Department
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartments()
        {
            if (_context.Departments == null)
            {
                return NotFound();
            }
            return await _context.Departments.OrderBy(d => d.Name).ToListAsync();
        }

        // POST: api/Department
        [HttpPost]
        public async Task<ActionResult<Department>> PostDepartment(Department department)
        {
            if (_context.Departments == null)
            {
                return Problem("Entity set 'SchoolDbContext.Departments'  is null.");
            }

            if (string.IsNullOrWhiteSpace(department.Name))
            {
                return BadRequest(new { title = "Department name cannot be empty." });
            }

            if (string.IsNullOrEmpty(department.Id))
            {
                department.Id = Guid.NewGuid().ToString();
            }

            // The Location property was made non-nullable in a later migration with a default value.
            // We ensure it's not null here to prevent database errors.
            department.Location ??= "";

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDepartments), new { id = department.Id }, department);
        }
    }
}