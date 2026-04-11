using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Auth;
using Nexbuy.DTOs.Common;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/auth")]
public class AdminAuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AdminAuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> AdminLogin([FromBody] AdminLoginRequest request)
    {
        var result = await _authService.AdminLoginAsync(request);
        return Ok(ApiResponse<LoginResponse>.Ok(result));
    }
}
