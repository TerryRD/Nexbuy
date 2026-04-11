using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.Helpers;
using Nexbuy.Middleware;
using Nexbuy.Models;
using Nexbuy.Models.Enums;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Services.Admin;

public class AdminPromotionService : IAdminPromotionService
{
    private readonly NexbuyDbContext _db;

    public AdminPromotionService(NexbuyDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<AdminCouponRequest>> GetCouponsAsync(int page, int pageSize)
    {
        var query = _db.Coupons
            .OrderByDescending(c => c.Id)
            .Select(c => new AdminCouponRequest
            {
                Code = c.Code,
                Type = (byte)c.Type,
                Value = c.Value,
                MinOrderAmount = c.MinOrderAmount,
                UsageLimit = c.UsageLimit,
                StartAt = c.StartAt,
                ExpiredAt = c.ExpiredAt,
                Status = (byte)c.Status
            });

        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<AdminCouponRequest> CreateCouponAsync(AdminCouponRequest request)
    {
        var exists = await _db.Coupons.AnyAsync(c => c.Code == request.Code);
        if (exists)
            throw new BusinessException("Coupon code already exists.", "COUPON_CODE_EXISTS");

        var coupon = new Coupon
        {
            Code = request.Code,
            Type = (CouponType)request.Type,
            Value = request.Value,
            MinOrderAmount = request.MinOrderAmount ?? 0,
            UsageLimit = request.UsageLimit,
            StartAt = request.StartAt ?? DateTime.UtcNow,
            ExpiredAt = request.ExpiredAt ?? DateTime.UtcNow.AddMonths(1),
            Status = (CouponStatus)request.Status
        };

        _db.Coupons.Add(coupon);
        await _db.SaveChangesAsync();

        return MapCouponToDto(coupon);
    }

    public async Task<AdminCouponRequest> UpdateCouponAsync(Guid id, AdminCouponRequest request)
    {
        var couponId = GuidToInt(id);
        var coupon = await _db.Coupons.FindAsync(couponId);
        if (coupon == null)
            throw new BusinessException("Coupon not found.", "COUPON_NOT_FOUND", 404);

        if (coupon.Code != request.Code)
        {
            var codeExists = await _db.Coupons.AnyAsync(c => c.Code == request.Code && c.Id != couponId);
            if (codeExists)
                throw new BusinessException("Coupon code already exists.", "COUPON_CODE_EXISTS");
        }

        coupon.Code = request.Code;
        coupon.Type = (CouponType)request.Type;
        coupon.Value = request.Value;
        coupon.MinOrderAmount = request.MinOrderAmount ?? coupon.MinOrderAmount;
        coupon.UsageLimit = request.UsageLimit;
        coupon.StartAt = request.StartAt ?? coupon.StartAt;
        coupon.ExpiredAt = request.ExpiredAt ?? coupon.ExpiredAt;
        coupon.Status = (CouponStatus)request.Status;

        await _db.SaveChangesAsync();

        return MapCouponToDto(coupon);
    }

    public async Task UpdateCouponStatusAsync(Guid id, byte status)
    {
        var couponId = GuidToInt(id);
        var coupon = await _db.Coupons.FindAsync(couponId);
        if (coupon == null)
            throw new BusinessException("Coupon not found.", "COUPON_NOT_FOUND", 404);

        coupon.Status = (CouponStatus)status;
        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Converts a Guid to int by reading the first 4 bytes.
    /// Used because the interface accepts Guid but Coupon.Id is int.
    /// Callers should create the Guid via: new Guid(intId, 0, 0, new byte[8])
    /// </summary>
    private static int GuidToInt(Guid id)
    {
        var bytes = id.ToByteArray();
        return BitConverter.ToInt32(bytes, 0);
    }

    private static AdminCouponRequest MapCouponToDto(Coupon coupon)
    {
        return new AdminCouponRequest
        {
            Code = coupon.Code,
            Type = (byte)coupon.Type,
            Value = coupon.Value,
            MinOrderAmount = coupon.MinOrderAmount,
            UsageLimit = coupon.UsageLimit,
            StartAt = coupon.StartAt,
            ExpiredAt = coupon.ExpiredAt,
            Status = (byte)coupon.Status
        };
    }
}
