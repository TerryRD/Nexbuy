using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/reports")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminReportsController : ControllerBase
{
    private readonly IAdminReportService _adminReportService;

    public AdminReportsController(IAdminReportService adminReportService)
    {
        _adminReportService = adminReportService;
    }

    [HttpGet("sales")]
    public async Task<ActionResult<ApiResponse<List<SalesReportDto>>>> GetSalesReport(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var result = await _adminReportService.GetSalesReportAsync(startDate, endDate);
        return Ok(ApiResponse<List<SalesReportDto>>.Ok(result));
    }

    [HttpGet("products/top")]
    public async Task<ActionResult<ApiResponse<List<TopProductDto>>>> GetTopProducts(
        [FromQuery] int count = 10)
    {
        var result = await _adminReportService.GetTopProductsAsync(count);
        return Ok(ApiResponse<List<TopProductDto>>.Ok(result));
    }

    [HttpGet("orders/trend")]
    public async Task<ActionResult<ApiResponse<List<OrderTrendDto>>>> GetOrderTrend(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var result = await _adminReportService.GetOrderTrendAsync(startDate, endDate);
        return Ok(ApiResponse<List<OrderTrendDto>>.Ok(result));
    }

    [HttpGet("sales/export")]
    public async Task<IActionResult> ExportSalesReport(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var (fileBytes, contentType, fileName) = await _adminReportService.ExportSalesReportAsync(startDate, endDate);
        return File(fileBytes, contentType, fileName);
    }
}
