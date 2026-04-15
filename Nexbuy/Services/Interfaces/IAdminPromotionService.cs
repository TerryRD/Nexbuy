using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;

namespace Nexbuy.Services.Interfaces;

public interface IAdminPromotionService
{
    Task<PagedResult<AdminCouponRequest>> GetCouponsAsync(int page, int pageSize);
    Task<AdminCouponRequest> CreateCouponAsync(AdminCouponRequest request);
    Task<AdminCouponRequest> UpdateCouponAsync(Guid id, AdminCouponRequest request);
    Task UpdateCouponStatusAsync(Guid id, byte status);
}
