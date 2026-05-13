using System;
using System.Security.Claims;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Entities; 

namespace SchoolAPI.Controllers
{
    [ApiController]
    [Route("api/inventory/write-offs")]
    public class WriteOffsController : ControllerBase
    {
        private readonly IApplicationDbContext _context;

        public WriteOffsController(IApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /api/inventory/write-offs
        [HttpGet]
        public async Task<IActionResult> GetWriteOffs([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
        {
            var query = _context.WriteOffs
                .Include(w => w.Product)
                .OrderByDescending(w => w.CreatedDate);

            var totalCount = await query.CountAsync(cancellationToken);

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(w => (object)new
                {
                    w.Id,
                    w.ProductId,
                    ProductName = w.Product != null ? w.Product.ProductName : "Unknown",
                    CodeNumber = w.Product != null ? w.Product.CodeNumber : null,
                    w.Quantity,
                    Reason = (int)w.Reason, 
                    w.Description,
                    Status = w.Status.ToString(),
                    w.CreatedDate,
                    // CreatedBy = w.CreatedBy
                })
                .ToListAsync(cancellationToken);

            return Ok(new PagedResult<object> { Items = items, TotalCount = totalCount });
        }

        // POST: /api/inventory/write-offs
        [HttpPost]
        public async Task<IActionResult> CreateWriteOff([FromBody] CreateWriteOffDto request, CancellationToken cancellationToken)
        {
            // Safely map the logged-in user to a Responsible Person in the DB
            var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("fullName")?.Value ?? "Unknown User";
            var person = await _context.Persons.FirstOrDefaultAsync(p => p.FullName == userName, cancellationToken);
            if (person == null)
            {
                person = new Person { Id = Guid.NewGuid(), FullName = userName };
                _context.Persons.Add(person);
                await _context.SaveChangesAsync(cancellationToken);
            }

            var writeOff = new WriteOff
            {
                Id = Guid.NewGuid().ToString(),
                WriteOffNumber = "WO-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss"),
                ProductId = request.ProductId,
                Quantity = request.Quantity,
                Reason = (WriteOffReason)request.Reason,
                Description = request.Description,
                Status = WriteOffStatus.Pending,
                RequestedById = person.Id,
                CreatedDate = DateTime.UtcNow
            };

            _context.WriteOffs.Add(writeOff);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(writeOff);
        }

        // POST: /api/inventory/write-offs/{id}/approve
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveWriteOff(string id, CancellationToken cancellationToken)
        {
            var writeOff = await _context.WriteOffs.FindAsync(new object[] { id }, cancellationToken);
            if (writeOff == null) return NotFound(new { title = "Write-Off not found." });

            if (writeOff.Status != WriteOffStatus.Pending) 
                return BadRequest(new { title = "Only pending write-offs can be approved." });

            writeOff.Status = WriteOffStatus.Approved;
            
            var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("fullName")?.Value ?? "Unknown User";
            var person = await _context.Persons.FirstOrDefaultAsync(p => p.FullName == userName, cancellationToken);
            if (person == null)
            {
                person = new Person { Id = Guid.NewGuid(), FullName = userName };
                _context.Persons.Add(person);
            }
            
            writeOff.ApprovedById = person.Id;
            writeOff.ApprovedAt = DateTime.UtcNow;

            var product = await _context.Products.FindAsync(new object[] { writeOff.ProductId }, cancellationToken);
            if (product != null)
            {
                product.AvailableQuantity -= writeOff.Quantity;
                product.TotalQuantity -= writeOff.Quantity; // Optional: Deduct TotalQuantity as well since the item is destroyed
            }

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { message = "Write-Off approved successfully." });
        }

        // POST: /api/inventory/write-offs/{id}/reject
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectWriteOff(string id, CancellationToken cancellationToken)
        {
            var writeOff = await _context.WriteOffs.FindAsync(new object[] { id }, cancellationToken);
            if (writeOff == null) return NotFound(new { title = "Write-Off not found." });

            if (writeOff.Status != WriteOffStatus.Pending) 
                return BadRequest(new { title = "Only pending write-offs can be rejected." });

            writeOff.Status = WriteOffStatus.Rejected;

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { message = "Write-Off rejected successfully." });
        }

        // POST: /api/inventory/write-offs/{id}/undo
        [HttpPost("{id}/undo")]
        public async Task<IActionResult> UndoWriteOff(string id, CancellationToken cancellationToken)
        {
            var writeOff = await _context.WriteOffs.FindAsync(new object[] { id }, cancellationToken);
            if (writeOff == null) return NotFound(new { title = "Write-Off not found." });

            if (writeOff.Status == WriteOffStatus.Pending) 
                return BadRequest(new { title = "Write-Off is already pending." });

            if (writeOff.Status == WriteOffStatus.Approved) 
            {
                // Revert the product quantity deduction
                var product = await _context.Products.FindAsync(new object[] { writeOff.ProductId }, cancellationToken);
                if (product != null)
                {
                    product.AvailableQuantity += writeOff.Quantity;
                    product.TotalQuantity += writeOff.Quantity;
                }
            }

            writeOff.Status = WriteOffStatus.Pending; 

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { message = "Write-Off action reverted to pending successfully." });
        }
    }

    public class CreateWriteOffDto
    {
        public string ProductId { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public int Reason { get; set; }
        public string? Description { get; set; }
    }
}