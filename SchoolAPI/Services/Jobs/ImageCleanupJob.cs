using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SchoolAPI.Application.Common.Interfaces;

namespace SchoolAPI.Services.Jobs;

public class ImageCleanupJob
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ImageCleanupJob> _logger;

    public ImageCleanupJob(IApplicationDbContext context, ILogger<ImageCleanupJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting unused Base64 image cleanup job...");

        // Look for images attached to products that were soft-deleted > 30 days ago
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var unusedImages = await _context.ProductImages
            .Include(pi => pi.Product)
            .Where(pi => pi.Product == null || (!pi.Product.IsActive && pi.Product.UpdateDate < thirtyDaysAgo))
            .ToListAsync(cancellationToken);

        if (unusedImages.Any())
        {
            _context.ProductImages.RemoveRange(unusedImages);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully permanently deleted {Count} unused Base64 images to save database space.", unusedImages.Count);
        }
    }
}
