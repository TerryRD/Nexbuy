using Nexbuy.DTOs.Admin;

namespace Nexbuy.Services.Interfaces;

public interface IAdminPointService
{
    Task<AdminPointRuleRequest> GetPointRulesAsync();
    Task UpdatePointRulesAsync(AdminPointRuleRequest request, Guid adminId);
}
