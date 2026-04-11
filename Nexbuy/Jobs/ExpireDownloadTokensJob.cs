using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;

namespace Nexbuy.Jobs;

public class ExpireDownloadTokensJob
{
    private readonly NexbuyDbContext _context;
    private readonly ILogger<ExpireDownloadTokensJob> _logger;

    public ExpireDownloadTokensJob(NexbuyDbContext context, ILogger<ExpireDownloadTokensJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        var now = DateTime.UtcNow;
        var expired = await _context.DigitalDownloads
            .Where(d => !d.IsRevoked && d.ExpiresAt < now)
            .ToListAsync();

        foreach (var download in expired)
        {
            download.IsRevoked = true;
        }

        if (expired.Count > 0)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Revoked {Count} expired download tokens", expired.Count);
        }
    }
}
