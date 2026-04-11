using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers;

[ApiController]
[Route("api/v1/points")]
public class PointsController : ControllerBase
{
    private readonly IAdminPointService _adminPointService;

    public PointsController(IAdminPointService adminPointService)
    {
        _adminPointService = adminPointService;
    }

    [AllowAnonymous]
    [HttpGet("rules")]
    public async Task<ActionResult<ApiResponse<AdminPointRuleRequest>>> GetPointRules()
    {
        var result = await _adminPointService.GetPointRulesAsync();
        return Ok(ApiResponse<AdminPointRuleRequest>.Ok(result));
    }
}
