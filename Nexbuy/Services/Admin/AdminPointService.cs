using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.DTOs.Admin;
using Nexbuy.Middleware;
using Nexbuy.Models;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Services.Admin;

public class AdminPointService : IAdminPointService
{
    private readonly NexbuyDbContext _db;

    public AdminPointService(NexbuyDbContext db)
    {
        _db = db;
    }

    public async Task<AdminPointRuleRequest> GetPointRulesAsync()
    {
        var rule = await _db.PointRules.FirstOrDefaultAsync();
        if (rule == null)
        {
            // Return defaults if no rule exists
            return new AdminPointRuleRequest
            {
                EarnRate = 1m,
                RedeemRate = 1m,
                PointExpiryMonths = 12
            };
        }

        return new AdminPointRuleRequest
        {
            EarnRate = rule.EarnRate,
            RedeemRate = rule.RedeemRate,
            PointExpiryMonths = rule.PointExpiryMonths
        };
    }

    public async Task UpdatePointRulesAsync(AdminPointRuleRequest request, Guid adminId)
    {
        var rule = await _db.PointRules.FirstOrDefaultAsync();

        if (rule == null)
        {
            rule = new PointRule
            {
                EarnRate = request.EarnRate,
                RedeemRate = request.RedeemRate,
                PointExpiryMonths = request.PointExpiryMonths,
                UpdatedBy = adminId,
                UpdatedAt = DateTime.UtcNow
            };
            _db.PointRules.Add(rule);
        }
        else
        {
            rule.EarnRate = request.EarnRate;
            rule.RedeemRate = request.RedeemRate;
            rule.PointExpiryMonths = request.PointExpiryMonths;
            rule.UpdatedBy = adminId;
            rule.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }
}
