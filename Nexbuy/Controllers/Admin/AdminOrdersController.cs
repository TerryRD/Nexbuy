using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Orders;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/orders")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminOrdersController : ControllerBase
{
    private readonly IAdminOrderService _adminOrderService;

    public AdminOrdersController(IAdminOrderService adminOrderService)
    {
        _adminOrderService = adminOrderService;
    }

    [HttpGet("")]
    public async Task<ActionResult<ApiResponse<PagedResult<OrderSummaryDto>>>> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] byte? status = null,
        [FromQuery] string? search = null)
    {
        var result = await _adminOrderService.GetOrdersAsync(page, pageSize, status, search);
        return Ok(ApiResponse<PagedResult<OrderSummaryDto>>.Ok(result));
    }

    [HttpGet("{orderNo}")]
    public async Task<ActionResult<ApiResponse<OrderDetailDto>>> GetOrderDetail([FromRoute] string orderNo)
    {
        var result = await _adminOrderService.GetOrderDetailAsync(orderNo);
        return Ok(ApiResponse<OrderDetailDto>.Ok(result));
    }

    [HttpPut("{orderNo}/status")]
    public async Task<ActionResult<ApiResponse>> UpdateStatus(
        [FromRoute] string orderNo,
        [FromBody] AdminOrderStatusRequest request)
    {
        await _adminOrderService.UpdateStatusAsync(orderNo, request);
        return Ok(ApiResponse.Ok());
    }

    [HttpPut("{orderNo}/tracking")]
    public async Task<ActionResult<ApiResponse>> UpdateTracking(
        [FromRoute] string orderNo,
        [FromBody] AdminTrackingRequest request)
    {
        await _adminOrderService.UpdateTrackingAsync(orderNo, request);
        return Ok(ApiResponse.Ok());
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportOrders(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var (fileBytes, contentType, fileName) = await _adminOrderService.ExportOrdersAsync(startDate, endDate);
        return File(fileBytes, contentType, fileName);
    }
}
