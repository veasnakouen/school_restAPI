using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using System.Linq;
using SchoolAPI.Entities;
using System.Threading.Tasks;

namespace SchoolAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PersonController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public PersonController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPersons(CancellationToken cancellationToken)
    {
        var persons = await _context.Persons
            .Where(p => p.IsActive == true)
            .OrderBy(p => p.FullName)
            .Select(p => new
            {
                p.Id,
                p.FullName
            })
            .ToListAsync(cancellationToken);

        return Ok(persons);
    }

    public class PersonDtoRequest { public string FullName { get; set; } = string.Empty; }

    [HttpPost]
    public async Task<IActionResult> CreatePerson([FromBody] PersonDtoRequest request, CancellationToken cancellationToken)
    {
        var person = new Person { Id = Guid.NewGuid(), FullName = request.FullName, IsActive = true };
        _context.Persons.Add(person);
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { Id = person.Id, FullName = person.FullName });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePerson(Guid id, [FromBody] PersonDtoRequest request, CancellationToken cancellationToken)
    {
        var person = await _context.Persons.FindAsync(new object[] { id }, cancellationToken);
        if (person == null) return NotFound(new { message = "Person not found." });
        
        person.FullName = request.FullName;
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { Id = person.Id, FullName = person.FullName });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePerson(Guid id, CancellationToken cancellationToken)
    {
        var person = await _context.Persons.FindAsync(new object[] { id }, cancellationToken);
        if (person == null) return NotFound(new { message = "Person not found." });
        _context.Persons.Remove(person);
        
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Person deleted successfully." });
        }
        catch (DbUpdateException)
        {
            return BadRequest(new { message = "Cannot delete this item because it is currently in use by other records (e.g., assigned to a product)." });
        }
    }
}