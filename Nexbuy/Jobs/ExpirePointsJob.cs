using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.Models;
using Nexbuy.Models.Enums;

namespace Nexbuy.Jobs;

public class ExpirePointsJob
{
    private readonly NexbuyDbContext _context;
    private readonly ILogger<ExpirePointsJob> _logger;

    public ExpirePointsJob(NexbuyDbContext context, ILogger<ExpirePointsJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        var now = DateTime.UtcNow;

        var expiredPoints = await _context.Points
            .Where(p => p.Type == PointType.Earn && p.ExpiresAt != null && p.ExpiresAt < now && p.Amount > 0)
            .ToListAsync();

        var expiredByUser = expiredPoints.GroupBy(p => p.UserId);

        foreach (var group in expiredByUser)
        {
            var userId = group.Key;
            var totalExpired = group.Sum(p => p.Amount);

            var expireRecord = new Point
            {
                UserId = userId,
                Type = PointType.Expire,
                Amount = -totalExpired,
                Note = $"積點到期失效 ({group.Count()} 筆)",
                CreatedAt = DateTime.UtcNow
            };

            _context.Points.Add(expireRecord);

            foreach (var point in group)
            {
                point.Amount = 0;
            }

            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.PointBalance = Math.Max(0, user.PointBalance - totalExpired);
            }
        }

        if (expiredPoints.Count > 0)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Expired {Count} point records for {UserCount} users",
                expiredPoints.Count, expiredByUser.Count());
        }
    }
}
