using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.Models;
using Nexbuy.Models.Enums;

namespace Nexbuy.Jobs;

public class GrantOrderPointsJob
{
    private readonly NexbuyDbContext _context;
    private readonly ILogger<GrantOrderPointsJob> _logger;

    public GrantOrderPointsJob(NexbuyDbContext context, ILogger<GrantOrderPointsJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid orderId)
    {
        var order = await _context.Orders
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.Status == OrderStatus.Completed);

        if (order == null) return;

        var existingPoints = await _context.Points
            .AnyAsync(p => p.OrderId == orderId && p.Type == PointType.Earn);

        if (existingPoints) return;

        var rule = await _context.PointRules.FirstOrDefaultAsync();
        if (rule == null) return;

        var pointsToGrant = (int)(order.TotalAmount * rule.EarnRate);
        if (pointsToGrant <= 0) return;

        var point = new Point
        {
            UserId = order.UserId,
            OrderId = orderId,
            Type = PointType.Earn,
            Amount = pointsToGrant,
            ExpiresAt = DateTime.UtcNow.AddMonths(rule.PointExpiryMonths),
            Note = $"訂單 {order.OrderNo} 消費回饋",
            CreatedAt = DateTime.UtcNow
        };

        _context.Points.Add(point);
        order.User.PointBalance += pointsToGrant;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Granted {Points} points to user {UserId} for order {OrderNo}",
            pointsToGrant, order.UserId, order.OrderNo);
    }
}
