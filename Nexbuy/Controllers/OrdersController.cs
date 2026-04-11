using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Orders;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers;

[ApiController]
[Route("api/v1/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost("")]
    public async Task<ActionResult<ApiResponse<OrderDetailDto>>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _orderService.CreateOrderAsync(userId, request);
        return Ok(ApiResponse<OrderDetailDto>.Ok(result));
    }

    [HttpGet("")]
    public async Task<ActionResult<ApiResponse<PagedResult<OrderSummaryDto>>>> GetOrders(
        [FromQuery] OrderListRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _orderService.GetOrdersAsync(userId, request);
        return Ok(ApiResponse<PagedResult<OrderSummaryDto>>.Ok(result));
    }

    [HttpGet("{orderNo}")]
    public async Task<ActionResult<ApiResponse<OrderDetailDto>>> GetOrderDetail([FromRoute] string orderNo)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _orderService.GetOrderDetailAsync(userId, orderNo);
        return Ok(ApiResponse<OrderDetailDto>.Ok(result));
    }

    [HttpPost("{orderNo}/cancel")]
    public async Task<ActionResult<ApiResponse>> CancelOrder([FromRoute] string orderNo)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _orderService.CancelOrderAsync(userId, orderNo);
        return Ok(ApiResponse.Ok());
    }

    [HttpPost("{orderNo}/return")]
    public async Task<ActionResult<ApiResponse>> ReturnOrder([FromRoute] string orderNo)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _orderService.ReturnOrderAsync(userId, orderNo);
        return Ok(ApiResponse.Ok());
    }

    [HttpGet("{orderNo}/downloads")]
    public async Task<ActionResult<ApiResponse<List<DownloadLinkDto>>>> GetDownloads([FromRoute] string orderNo)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _orderService.GetDownloadsAsync(userId, orderNo);
        return Ok(ApiResponse<List<DownloadLinkDto>>.Ok(result));
    }
}
