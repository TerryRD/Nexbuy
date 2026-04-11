using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/points")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminPointsController : ControllerBase
{
    private readonly IAdminPointService _adminPointService;

    public AdminPointsController(IAdminPointService adminPointService)
    {
        _adminPointService = adminPointService;
    }

    [HttpGet("rules")]
    public async Task<ActionResult<ApiResponse<AdminPointRuleRequest>>> GetPointRules()
    {
        var result = await _adminPointService.GetPointRulesAsync();
        return Ok(ApiResponse<AdminPointRuleRequest>.Ok(result));
    }

    [HttpPut("rules")]
    public async Task<ActionResult<ApiResponse>> UpdatePointRules([FromBody] AdminPointRuleRequest request)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _adminPointService.UpdatePointRulesAsync(request, adminId);
        return Ok(ApiResponse.Ok());
    }
}
