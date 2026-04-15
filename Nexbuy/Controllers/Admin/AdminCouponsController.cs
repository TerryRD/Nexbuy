using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/coupons")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminCouponsController : ControllerBase
{
    private readonly IAdminPromotionService _adminPromotionService;

    public AdminCouponsController(IAdminPromotionService adminPromotionService)
    {
        _adminPromotionService = adminPromotionService;
    }

    [HttpGet("")]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminCouponRequest>>>> GetCoupons(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _adminPromotionService.GetCouponsAsync(page, pageSize);
        return Ok(ApiResponse<PagedResult<AdminCouponRequest>>.Ok(result));
    }

    [HttpPost("")]
    public async Task<ActionResult<ApiResponse<AdminCouponRequest>>> CreateCoupon(
        [FromBody] AdminCouponRequest request)
    {
        var result = await _adminPromotionService.CreateCouponAsync(request);
        return Ok(ApiResponse<AdminCouponRequest>.Ok(result));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<AdminCouponRequest>>> UpdateCoupon(
        [FromRoute] Guid id,
        [FromBody] AdminCouponRequest request)
    {
        var result = await _adminPromotionService.UpdateCouponAsync(id, request);
        return Ok(ApiResponse<AdminCouponRequest>.Ok(result));
    }

    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse>> UpdateCouponStatus(
        [FromRoute] Guid id,
        [FromBody] AdminOrderStatusRequest request)
    {
        await _adminPromotionService.UpdateCouponStatusAsync(id, request.Status);
        return Ok(ApiResponse.Ok());
    }
}
